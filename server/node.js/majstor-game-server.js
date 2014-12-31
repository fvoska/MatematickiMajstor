// TODO: Don't send JSON, send things through socket emit parameters when data is simple.

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
        var oldRoom = socket.room;
        var newRoomStripped = newRoom;

        // Prepend room name with "_" to differentiate it from default socket room names (don't prepend to lobby).
        if (newRoom != "Lobby") {
            newRoom = "_" + newRoom;
        }

        // Add user to room if room isn't full.
        var clientsInRoom = findClientsSocketByRoomId(newRoom).length;
        if (clientsInRoom == null || clientsInRoom < 4) {
            // Leave old room and enter new room.
            socket.leave(socket.room);
            socket.join(newRoom);

            // Notify others of leaving.
            socket.emit('updateChat', 'SERVER', 'you have connected to ' + newRoomStripped);
            socket.broadcast.to(oldRoom).emit('updateChat', 'SERVER', socket.username + ' has left this room');

            // Return rooms to Lobby.
            socket.broadcast.to(oldRoom).emit('updateRooms', updateRooms(), null);
            socket.room = newRoom;

            // Notify others of joining.
            socket.broadcast.to(newRoom).emit('updateChat', 'SERVER', socket.username + ' has joined this room');

            var usersList = findUsernamesByRoomId(newRoom);
            socket.broadcast.to(newRoom).emit("updateUsers", usersList);
            socket.emit("updateUsers", usersList);
        }
        else {
            socket.emit('roomFull');
        }

        // Check if last joined user was 4th.
        clientsInRoom = findClientsSocketByRoomId(newRoom).length;
        if (clientsInRoom == 4) {
            // Start game.
            setTimeout(function() {
                sendTask(newRoom);
            }, 1000);

            // Repeatedly check if everyone answered (every 2 sec).
            /*var myTimer = setInterval(function() {
                var roundOver = checkRoundResults(socket.room);
                if (roundOver) clearInterval(myTimer);
            }, 2000);*/
        }
    });

    socket.on('taskAnswered', function(result, time) {
        // Update current user answer time.
        socket.answerStatus = result;
        socket.answerTime = time;

        // Let others know
        io.sockets["in"](socket.room).emit('someoneAnswered', socket.username, result, time);

        // Write to console.
        console.log("[" + socket.room + "] " + socket.username + " answered " + result + " in " + time + "s");

        checkRoundResults(socket.room);
    });

    // Disconnect user.
    socket.on('disconnect', function() {
        /*
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        */
        socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});

// Listen for games
http.listen(portGame, function() {
    console.log("Listening on *:" + portGame);
});

function checkRoundResults(roomId) {
    // TODO: this needs to be refactored. Maybe use multi for redis
    var players = findClientsSocketByRoomId(roomId);

    var fastestPlayer = null;
    var timeLimit = 20;
    var fastestTime = timeLimit; // This is maximum time allowed for solving - 20s
    var numAnswered = 0;

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

    if (numAnswered == 4) {
        var over = false;
        if (fastestPlayer != null) {
            // Round winner.
            console.log(fastestPlayer.username + " won the round with time " + fastestTime + "s");
            fastestPlayer.won += 1;
            if (fastestPlayer.won == 3) {
                // Game winner as well.
                console.log(fastestPlayer.username + " won the game");
                over = true;
            }

            io.sockets["in"](roomId).emit('roundResults', fastestPlayer.username, fastestTime, over);
        }
        else {
            // Noone answered in time.
            console.log("Noone answered faster than " + timeLimit + "s");
            io.sockets["in"](roomId).emit('roundResults', null, -1, false);
        }

        if (!over) {
            setTimeout(function () {
                sendTask(roomId);
            }, 1000);
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

    // Generate a task with suggestions.
    generator.create(2, ['+', '-', '*']);
    var task = generator.getTask();
    var result = generator.getResult();
    var suggestions = generator.getSuggestions();

    // Construct JSON with task, result and suggestions.
    var taskJSON = "{\"task\":\"" + task.join(" ") + "\",\"result\":\"" + result + "\",\"suggestions\": null}";
    taskJSON = JSON.parse(taskJSON);
    taskJSON.suggestions = suggestions;

    // Send to sockets.
    io.sockets["in"](toRoom).emit('task', JSON.stringify(taskJSON));
}