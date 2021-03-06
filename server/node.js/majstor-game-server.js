/*
    TODO #1: Punish when leaving the room.
    TODO #2: Some security when posting results.
    TODO #3: What happens if client answers later than serverTimeout - clientLimit?
*/

// Game controller port.
var portGame = process.env.PORT || 8080;

// Redis host and port for socket.io.
var hostRedisSockets = "127.0.0.1";
var portRedisSockets = 6379;

// Load parameters and override if needed.
for (var i = 0; i < process.argv.length; i++)
{
    var split = process.argv[i].split("=");
    if (split.length == 2)
    {
        switch(split[0])
        {
            case "portGame":
                portGame = parseInt(split[1]);
                break;
            case "portRedisSockets":
                portRedisSockets = parseInt(split[1]);
                break;
            case "hostRedisSockets":
                hostRedisSockets = split[1];
                break;
        }
    }
}

// Task generator and solver
var generator = require("./majstor-generator.js");
var requiredRoundsToWin = 5;
var timeLimit = 15;
var timeLimitTimeout = null;
var forceExit = false;

// Create server
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

// Distribute sockets across the servers using Redis.
var redisSockets = require("socket.io-redis");
io.adapter(redisSockets({ host: hostRedisSockets, port: portRedisSockets }));

// Configure socket events.
io.sockets.on("connection", function(socket) {
    // Add user to Lobby.
    socket.on("addUser", function(username, playerId) {
        // Assign username and default room
        socket.username = username;
        socket.room = "Lobby";
        socket.join("Lobby");
        socket.won = 0;
        socket.totalTime = 0;
        socket.totalAnswers = 0;
        socket.answerTime = -1;
        socket.answerStatus = "N";
        socket.ready = false;
        socket.playerId = parseInt(playerId);

        // Notify others that user has joined the Lobby.
        socket.emit("updateChat", "SERVER", "you have connected to Lobby");
        socket.broadcast.to("Lobby").emit("updateChat", "SERVER", username + " has connected to this room");

        // Return rooms to new user.
        socket.emit("updateRooms", updateRooms(), "Lobby");
    });

    // Send message to room.
    socket.on("sendChat", function(data) {
        io.sockets["in"](socket.room).emit("updateChat", socket.username, data);
    });

    // Switch user room.
    socket.on("switchRoom", function(newRoom) {
        var refreshUsers = true;
        //if (newRoom == "Lobby") refreshUsers = false;
        switchRoom(socket, newRoom, refreshUsers);
    });

    // Set ready state.
    socket.on("ready", function(isReady) {
        socket.ready = isReady;
        io.sockets["in"](socket.room).emit("readyFeedback", socket.username, isReady);
        console.log("[" + socket.room + "] Player \"" + socket.username + "\" ready: " + isReady);
        if (isReady) sendTask(socket.room);
    });

    // Refresh rooms list.
    socket.on("refreshRooms", function() {
        socket.emit("updateRooms", updateRooms(), "Lobby");
    });

    socket.on("taskAnswered", function(result, time) {
        // Update current user answer time.
        socket.answerStatus = result;
        socket.answerTime = time;

        // Handle timeout.
        if (result == "O") {
            console.log("[" + socket.room + "] " + socket.username + " did not answer in time");
            checkRoundResults(socket.room, false);
            return;
        }

        socket.totalTime += time;
        socket.totalAnswers += 1;

        // Let others know
        io.sockets["in"](socket.room).emit("someoneAnswered", socket.username, result, time);

        // Write to console.
        console.log("[" + socket.room + "] " + socket.username + " answered " + result + " in " + time + "s");

        checkRoundResults(socket.room, false);
    });

    // Disconnect user.
    socket.on("disconnect", function() {
        /*
        delete usernames[socket.username];
        io.sockets.emit("updateusers", usernames);
        */
        socket.broadcast.emit("updateChat", "SERVER", socket.username + " has disconnected");
        socket.leave(socket.room);
    });
});

function switchRoom(socket, newRoom, refreshUsers) {
    // Reset counters.
    socket.won = 0;
    socket.totalTime = 0;
    socket.totalAnswers = 0;
    socket.answerTime = -1;
    socket.answerStatus = "N";
    socket.ready = false;

    var oldRoom = socket.room;
    if (oldRoom == newRoom) return;
    var newRoomStripped = newRoom;

    var oldRoomSockets = findClientsSocketByRoomId(oldRoom);
    // Prepend room name with "_" to differentiate it from default socket room names (don't prepend to lobby).
    if (newRoom != "Lobby") {
        newRoom = "_" + newRoom;
    }
    else {
        // If we left the game and joined lobby, make players in old room unready.
        for (var i in oldRoomSockets) {
            var player = oldRoomSockets[i];
            player.ready = false;
        }
        if (timeLimitTimeout != null) {
            clearTimeout(timeLimitTimeout);
        }
    }

    console.log("Switching " + socket.username + " from " + oldRoom + " to " + newRoom);

    // Add user to room if room isn't full. Don't check capacity for Lobby.
    var clientsInRoom = findClientsSocketByRoomId(newRoom).length;
    var hasSlots = false;
    if (newRoom == "Lobby") hasSlots = true;
    else hasSlots = clientsInRoom < 4;
    if (clientsInRoom == null || hasSlots) {
        // Leave old room and enter new room.
        socket.leave(socket.room);
        socket.join(newRoom);
        socket.room = newRoom;

        // Notify others of joining/leaving.
        socket.emit("updateChat", "SERVER", "you have connected to " + newRoomStripped);
        socket.broadcast.to(oldRoom).emit("updateChat", "SERVER", socket.username + " has left this room");
        socket.broadcast.to(newRoom).emit("updateChat", "SERVER", socket.username + " has joined this room");

        // Return rooms to others.
        var roomList = updateRooms();
        socket.broadcast.to(oldRoom).emit("updateRooms", roomList, null);
        socket.emit("updateRooms", roomList, "Lobby");
        socket.broadcast.to(newRoom).emit("updateRooms", roomList, "Lobby");

        if (refreshUsers) {
            var usersListNew = findUsernamesByRoomId(newRoom);
            var usersListOld = findUsernamesByRoomId(oldRoom);
            if (oldRoom != "Lobby") {
                socket.broadcast.to(oldRoom).emit("updateUsers", usersListOld);
            }
            if (newRoom != "Lobby") {
                socket.emit("updateUsers", usersListNew);
                socket.broadcast.to(newRoom).emit("updateUsers", usersListNew);
            }
        }
    }
    else {
        socket.emit("roomFull");
        return;
    }

    /*
    // Check if last joined user was 4th.
    clientsInRoom = findClientsSocketByRoomId(newRoom).length;
    if (clientsInRoom == 4 && newRoom != "Lobby") {
        // Start game.
        setTimeout(function() {
            sendTask(newRoom);
        }, 1000);
    }
    */

    // Start game.
    setTimeout(function() {
        sendTask(newRoom);
    }, 2000);
}

function checkRoundResults(roomId, timeout) {
    if (!roomReady(roomId)) {
        return;
    }

    var fastestPlayer = null;
    var fastestTime = timeLimit; // This is maximum time allowed for solving
    var numAnswered = 0;

    var players = findClientsSocketByRoomId(roomId);
    if (players == null || players.length == 0) return;
    // Continue playing normally, even if only 2, 3 or 4 players.
    for (var i in players) {
        var player = players[i];
        var time = player.answerTime;
        var status = player.answerStatus;
        if (status != "N") {
            numAnswered++;
        }
        if (status == "T" && time < fastestTime) {
            fastestTime = time;
            fastestPlayer = player;
        }
    }

    if (numAnswered == players.length || timeout == true) {
        if (timeLimitTimeout != null) {
            clearTimeout(timeLimitTimeout);
        }
        var over = false;
        if (fastestPlayer != null) {
            // Round winner.
            console.log("[" + roomId + "] " + fastestPlayer.username + " won the round with time " + fastestTime + "s");
            for (var i in players) {
                player = players[i];
                player.answerTime = -1;
                player.answerStatus = "N";
            }
            fastestPlayer.won += 1;
            if (fastestPlayer.won == requiredRoundsToWin) {
                // Game winner as well.
                console.log("[" + roomId + "] " + fastestPlayer.username + " won the game");
                over = true;

                // Post results.
                var playersArray = [];
                for (var i = 0; i < players.length; i++) {
                    playersArray.push(JSON.stringify({ "userId": players[i].playerId, "totalTime": players[i].totalTime, "totalAnswers": players[i].totalAnswers }));
                }
                postResults(playersArray, fastestPlayer.playerId, roomId.substring(1));
            }

            io.sockets["in"](roomId).emit("roundResults", fastestPlayer.username, fastestTime, over);

            if (over) {
                if (forceExit) {
                    // Close room after game is over
                    shutDownRoom(roomId, true);
                }
                else {
                    // Leave players in room, just reset ready states.
                    for (var i in players) {
                        player = players[i];
                        player.won = 0;
                        player.totalTime = 0;
                        player.totalAnswers = 0;
                        player.answerTime = -1;
                        player.answerStatus = "N";
                        player.ready = false;
                    }

                    // Refresh users list.
                    var usersList = findUsernamesByRoomId(roomId);
                    for (var i in players) {
                        player = players[i];
                        player.emit("updateUsers", usersList);
                    }
                }
            }
        }
        else {
            // Noone answered in time.
            console.log("[" + roomId + "] " + "Noone answered faster than client time limit or server timeout limit(" + timeLimit + "s)");
            io.sockets["in"](roomId).emit("roundResults", null, -1, false);
        }

        if (!over) {
            setTimeout(function () {
                sendTask(roomId);
            }, 2000);
        }
    }
}

function shutDownRoom(roomId, throwOut) {
    var players = findClientsSocketByRoomId(roomId);
    for (var i in players) {
        var playerSocket = players[i];
        // Reset won counter and answer status/time.
        playerSocket.won = 0;
        playerSocket.totalTime = 0;
        playerSocket.totalAnswers = 0;
        playerSocket.answerTime = -1;
        playerSocket.answerStatus = "N";
        playerSocket.ready = false;

        if (timeLimitTimeout != null) {
            clearTimeout(timeLimitTimeout);
        }

        if (throwOut == true) {
            // Shut down the room.
            switchRoom(playerSocket, "Lobby", false);
        }
    }
}

function roomReady(roomId) {
    var sockets = findClientsSocketByRoomId(roomId);
    var numReady = 0;
    for (var s in sockets) {
        if (sockets[s].ready) {
            numReady++;
        }
    }
    return numReady == sockets.length;
}

function updateRooms() {
    var roomList = [];
    for (var key in io.sockets.adapter.rooms) {
        if (key.toString().indexOf("_") == 0) {
            //if (findClientsSocketByRoomId(key).length < 4) {
                var jsonRoom = "{\"roomName\":\"" + key.toString().split("_")[1] + "\"," + "\"numberOfUsers\":" + findClientsSocketByRoomId(key).length + ",\"ready\":" + roomReady(key) + "}";
                roomList.push(jsonRoom);
            //}
        }
    }
    return roomList;
}

function findClientsSocketByRoomId(roomId) {
    var res = [];
    var room = io.sockets.adapter.rooms[roomId];
    if (room) {
        for (var id in room) {
            res.push(io.sockets.adapter.nsp.connected[id]);
        }
    }
    return res;
}

function findUsernamesByRoomId(roomId) {
    var usernames = [];
    var sockets = findClientsSocketByRoomId(roomId);
    for (var s in sockets) {
        usernames.push({ "username": sockets[s].username, "ready": sockets[s].ready, "won": sockets[s].won });
    }
    return usernames;
}

function sendTask(toRoom) {
    var players = findClientsSocketByRoomId(toRoom);

    // Check if players are ready (at least 2 players).
    if (players.length > 1 && toRoom != "Lobby") {
        if (roomReady(toRoom)) {
            // Notify Lobby that the game has started.
            io.sockets["in"]("Lobby").emit("updateRooms", updateRooms(), "Lobby");

            // Clear players' time and status.
            for (var i in players) {
                var player = players[i];
                player.answerTime = -1;
                player.answerStatus = "N";
            }

            if (players.length < 2)
            {
                shutDownRoom(toRoom, false);
                return;
            }

            // Generate a task with suggestions.
            generator.create(2, ["+", "-", "*"]);
            var task = generator.getTask();
            var result = generator.getResult();
            var suggestions = generator.getSuggestions();

            // Construct JSON with task, result and suggestions.
            var taskJSON = "{\"task\":\"" + task.join(" ") + "\",\"result\":\"" + result + "\",\"suggestions\": null,\"required\": null}";
            taskJSON = JSON.parse(taskJSON);
            taskJSON.suggestions = suggestions;
            taskJSON.required = requiredRoundsToWin;

            // Send to sockets.
            io.sockets["in"](toRoom).emit("task", JSON.stringify(taskJSON));

            // Check at the end of time limit.
            if (timeLimitTimeout != null) {
                clearTimeout(timeLimitTimeout);
            }
            timeLimitTimeout = setTimeout(function() {
                console.log("TIMEOUT");
                checkRoundResults(toRoom, true);
            }, timeLimit * 1000);
        }
    }
}

var request = require('request');
var URLGameResultPost = "http://localhost/MatematickiMajstor/server/php/record_game_results.php";
function postResults(playersIds, winnerId, roomName) {
    console.log("POST: " + '{ "players": ' + playersIds + ', "winner": ' + winnerId + ', "roomName": ' + roomName + ' }');
    request.post({ url: URLGameResultPost, form: { "players": playersIds, "winner": winnerId, "roomName": roomName }}, function(err,httpResponse,body) {
        console.log("RESPONSE: " + body);
    });
}

// Listen for games
http.listen(portGame, function() {
    console.log("Listening on *:" + portGame);
});