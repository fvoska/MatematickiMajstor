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

// Distribute temporary game results
var redisGame = require("redis");
var redisGameClient = redisGame.createClient(portRedisSockets, hostRedisSockets);

// Configure socket events.
io.sockets.on('connection', function(socket) {
    // Add user to Lobby.
    socket.on('addUser', function(username) {
        // Assign username and default room
        socket.username = username;
        socket.room = 'Lobby';
        socket.join('Lobby');
        var playerStatusJSON = JSON.parse("{\"user\":\"" + socket.username + "\",\"won\":0,\"time\":0,\"status\":\"N\"}");
        redisGameClient.set(socket.username, JSON.stringify(playerStatusJSON));

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

            // Return rooms to everyone.
            socket.broadcast.to(oldRoom).emit('updateRooms', updateRooms(), null);
            socket.room = newRoom;

            // Notify others of joining.
            socket.broadcast.to(newRoom).emit('updateChat', 'SERVER', socket.username + ' has joined this room');
            var usersList = findUsernamesByRoomId(newRoom)
            socket.broadcast.to(newRoom).emit("updateUsers", usersList);
            socket.emit("updateUsers", usersList);

            /*
            // Don't update rooms if player is in a room other than lobby - no need.
            if (newRoomStripped == "Lobby") {
                socket.emit('updateRooms', updateRooms(), newRoomStripped);
            }
            */
            socket.emit('updateRooms', updateRooms(), newRoomStripped);
        }
        else {
            socket.emit('roomFull');
        }

        // Check if last joined user was 4th.
        clientsInRoom = findClientsSocketByRoomId(newRoom).length;
        if (clientsInRoom == 4) {
            // Start game.
            sendTask(newRoom);

            // Repeatedly check if everyone answered (every 2 sec).
            var myTimer = setInterval(function() {
                var roundOver = checkRoundResults(socket.room);
                if (roundOver) clearInterval(myTimer);
            }, 2000);
        }
    });

    socket.on('taskAnswered', function(result, time) {
        // Update current user answer time.
        redisGameClient.get(socket.username, function (err, reply) {
            // FORMAT: { "user": "u", "won": 2, "time": 4, "status": "T" }
            var playerStatusJSON = JSON.parse(reply);
            // Reply is null when the key is missing.
            if (reply == null) {
                playerStatusJSON = JSON.parse("{\"user\":\"" + socket.username + "\"\"won\":0,\"time\":0,\"status\":\"N\"}");
            }
            playerStatusJSON.time = time;
            playerStatusJSON.status = result;

            redisGameClient.set(socket.username, JSON.stringify(playerStatusJSON));

            console.log("[" + socket.room + "] " + socket.username + " answered " + playerStatusJSON.status + " in " + playerStatusJSON.time + "s");
        });

        io.sockets["in"](socket.room).emit('someoneAnswered', socket.username, result, time);
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
    var numAnswered = 0;
    var usernames = findUsernamesByRoomId(roomId);
    var fastestPlayer = null;
    var fastestTime = 20;
    for (var user in usernames)
    {
        redisGameClient.get(usernames[user], function (err, reply) {
            var usernames = findUsernamesByRoomId(roomId);
            var playerStatusJSON = JSON.parse(reply);
            // Reply is null when the key is missing.
            if (reply != null) {
                var user = playerStatusJSON.user;
                if (playerStatusJSON.time > 0) {
                    numAnswered++;
                    if (playerStatusJSON.status == "T" && playerStatusJSON.time < fastestTime) {
                        fastestTime = playerStatusJSON.time;
                        fastestPlayer = user;
                    }
                    if (numAnswered == 4) {
                        // Everyone answered!
                        console.log("[" + roomId + "] Everyone has answered");

                        // Update round winner.
                        if (fastestPlayer != null) {
                            // Someone was fastest, update his won counter.
                            redisGameClient.get(fastestPlayer, function (err, reply) {
                                var playerStatusJSON = JSON.parse(reply);
                                playerStatusJSON.won += 1;
                                playerStatusJSON.time = 0;
                                playerStatusJSON.status = "N";
                                redisGameClient.set(fastestPlayer, JSON.stringify(playerStatusJSON));
                            });

                            // Reset all times and statuses
                            for (var u in usernames) {
                                if (usernames[u] != fastestPlayer) {
                                    redisGameClient.get(usernames[u], function (err, reply) {
                                        var playerStatusJSON = JSON.parse(reply);
                                        playerStatusJSON.time = 0;
                                        playerStatusJSON.status = "N";
                                        redisGameClient.set(playerStatusJSON.user, JSON.stringify(playerStatusJSON));
                                    });
                                }
                            }
                        }
                        else {
                            // Noone answered correctly - reset time and status.
                            for (var u in usernames) {
                                redisGameClient.get(usernames[u], function (err, reply) {
                                    var playerStatusJSON = JSON.parse(reply);
                                    playerStatusJSON.time = 0;
                                    playerStatusJSON.status = "N";
                                    redisGameClient.set(playerStatusJSON.user, JSON.stringify(playerStatusJSON));
                                });
                            }
                        }

                        redisGameClient.get(fastestPlayer, function (err, reply) {
                            var over = false;
                            var playerStatusJSON = JSON.parse(reply);
                            if (playerStatusJSON.won == 3) {
                                over = true;
                            }

                            // Let clients know who won the round.
                            io.sockets["in"](roomId).emit('roundResults', fastestPlayer, fastestTime, over);
                            if (fastestPlayer != null) {
                                if (over) {
                                    console.log("Game winner: " + fastestPlayer + "(" + fastestTime + ")");
                                }
                                else {
                                    // TODO: this isn't working because of delayed redis calls.
                                    console.log("Round winner: " + fastestPlayer + "(" + fastestTime + ")");
                                }
                            }
                            else {
                                console.log("Noone answered correctly in time");
                            }

                            // Send new tasks if game isn't over yet.
                            if (!over) {
                                setTimeout(function() {
                                    sendTask(roomId);
                                }, 3000);
                            }
                        });
                        return true;
                    }
                    else return false;
                }
            }
        });
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
    var res = []
        , room = io.sockets.adapter.rooms[roomId];
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
    generator.create(2, ['+', '-', '*']);
    var task = generator.getTask();
    var result = generator.getResult();
    var taskJSON = "{\"task\":\"" + task.join(" ") + "\",\"result\":\"" + result + "\"}"
    io.sockets["in"](toRoom).emit('task', taskJSON);
}