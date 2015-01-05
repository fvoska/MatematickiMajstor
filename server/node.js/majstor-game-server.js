/*
    TODO #1: Stop game when only 1 player is left in game.
    TODO #2: Record round results.
    TODO #3: Add timestamp to room name.
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
var timeLimit = 15;
var timeLimitTimeout = null;

// Create server
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Distribute sockets across the servers using Redis.
var redisSockets = require('socket.io-redis');
io.adapter(redisSockets({ host: hostRedisSockets, port: portRedisSockets }));

// Configure socket events.
io.sockets.on('connection', function(socket) {
    // Add user to Lobby.
    socket.on('addUser', function(username) {
        // Assign username and default room
        socket.username = username;
        socket.room = 'Lobby';
        socket.join('Lobby');
        socket.won = 0;
        socket.answerTime = -1;
        socket.answerStatus = "N";

        // Notify others that user has joined the Lobby.
        socket.emit('updateChat', 'SERVER', 'you have connected to Lobby');
        socket.broadcast.to('Lobby').emit('updateChat', 'SERVER', username + ' has connected to this room');

        // Return rooms to new user.
        socket.emit('updateRooms', updateRooms(), 'Lobby');
    });

    // Send message to room.
    socket.on('sendChat', function(data) {
        io.sockets["in"](socket.room).emit('updateChat', socket.username, data);
    });

    // Switch user room.
    socket.on('switchRoom', function(newRoom) {
        var refreshUsers = true;
        //if (newRoom == "Lobby") refreshUsers = false;
        switchRoom(socket, newRoom, refreshUsers);
    });

    // Refresh rooms list.
    socket.on("refreshRooms", function() {
        socket.emit('updateRooms', updateRooms(), 'Lobby');
    });

    socket.on("taskAnswered", function(result, time) {
        // Update current user answer time.
        socket.answerStatus = result;
        socket.answerTime = time;

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

// Listen for games
http.listen(portGame, function() {
    console.log("Listening on *:" + portGame);
});

function switchRoom(socket, newRoom, refreshUsers) {
    // Reset counters.
    socket.won = 0;
    socket.answerTime = -1;
    socket.answerStatus = "N";

    var oldRoom = socket.room;
    var newRoomStripped = newRoom;

    if (oldRoom == newRoom) return;
    console.log("Switching " + socket.username + " from " + oldRoom + " to " + newRoom);

    // Prepend room name with "_" to differentiate it from default socket room names (don't prepend to lobby).
    if (newRoom != "Lobby") {
        newRoom = "_" + newRoom;
    }

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
    }

    // Check if last joined user was 4th.
    clientsInRoom = findClientsSocketByRoomId(newRoom).length;
    if (clientsInRoom == 4 && newRoom != "Lobby") {
        // Start game.
        setTimeout(function() {
            sendTask(newRoom);
        }, 1000);
    }
}

function checkInTime(roomId) {
    var fastestPlayer = null;
    var fastestTime = timeLimit; // This is maximum time allowed for solving - 20s
    var numAnswered = 0;

    var players = findClientsSocketByRoomId(roomId);
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

    return fastestPlayer;
}

function checkRoundResults(roomId, timeout) {
    var fastestPlayer = null;
    var fastestTime = timeLimit; // This is maximum time allowed for solving - 20s
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

    if (numAnswered == 4 || timeout == true) {
        var over = false;
        if (fastestPlayer != null) {
            // Round winner.
            console.log("[" + roomId + "] " + fastestPlayer.username + " won the round with time " + fastestTime + "s");
            fastestPlayer.won += 1;
            if (fastestPlayer.won == 3) {
                // Game winner as well.
                console.log("[" + roomId + "] " + fastestPlayer.username + " won the game");
                over = true;
            }

            io.sockets["in"](roomId).emit("roundResults", fastestPlayer.username, fastestTime, over);

            if (over) {
                shutDownRoom(roomId, true);
            }
        }
        else {
            // Noone answered in time.
            console.log("[" + roomId + "] " + "Noone answered faster than " + timeLimit + "s");
            io.sockets["in"](roomId).emit("roundResults", null, -1, false);
        }

        if (!over) {
            setTimeout(function () {
                sendTask(roomId);
            }, 1000);
        }
    }
}

function shutDownRoom(roomId, throwOut) {
    var players = findClientsSocketByRoomId(roomId);
    for (var i in players) {
        var playerSocket = players[i];
        // Reset won counter and answer status/time.
        playerSocket.won = 0;
        playerSocket.answerTime = -1;
        playerSocket.answerStatus = "N";

        if (timeLimitTimeout != null) {
            clearTimeout(timeLimitTimeout);
        }

        if (throwOut == true) {
            // Shut down the room.
            switchRoom(playerSocket, "Lobby", false);
        }
    }
}

function updateRooms() {
    var roomList = [];
    for (var key in io.sockets.adapter.rooms) {
        if (key.toString().indexOf("_") == 0) {
            if (findClientsSocketByRoomId(key).length < 4) {
                var jsonRoom = "{\"roomName\":\"" + key.toString().split("_")[1] + "\"," + "\"numberOfUsers\":" + findClientsSocketByRoomId(key).length + "}";
                roomList.push(jsonRoom);
            }
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
        usernames.push(sockets[s].username)
    }
    return usernames;
}

function sendTask(toRoom) {
    // Clear players' time and status.
    var players = findClientsSocketByRoomId(toRoom);
    for (var i in players) {
        var player = players[i];
        player.answerTime = -1;
        player.answerStatus = "N";
    }

    if (players.length < 4)
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
    var taskJSON = "{\"task\":\"" + task.join(" ") + "\",\"result\":\"" + result + "\",\"suggestions\": null}";
    taskJSON = JSON.parse(taskJSON);
    taskJSON.suggestions = suggestions;

    // Send to sockets.
    io.sockets["in"](toRoom).emit("task", JSON.stringify(taskJSON));

    // Check at the end of time limit.
    if (timeLimitTimeout != null) {
        clearTimeout(timeLimitTimeout);
    }
    timeLimitTimeout = setTimeout(function() {
        checkRoundResults(toRoom, true);
        /*var inTime = checkInTime(toRoom);
        if (inTime == null)
        {
            // Timeout, noone answered in time.
            console.log("[" + toRoom + "] " + "Noone answered faster than " + timeLimit + "s");
            io.sockets["in"](toRoom).emit("roundResults", null, -1, false);
            sendTask(toRoom);
        }*/
    }, timeLimit * 1000);
}