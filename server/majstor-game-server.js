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
io.adapter(redisSockets({ host: 'localhost', port: 6379 }));


// Configure socket events
io.sockets.on('connection', function(socket) {
    socket.on('adduser', function(username) {
        socket.username = username;
        socket.room = 'Lobby';
        socket.join('Lobby');
        socket.emit('updatechat', 'SERVER', 'you have connected to Lobby');
        socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', updateRooms(), 'Lobby');
    });

    socket.on('sendchat', function(data) {
        io.sockets["in"](socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('switchRoom', function(newroom) {
        var oldroom;
        var newroomStriped = newroom;
        oldroom = socket.room;
        if (newroom != "Lobby") {
            newroom = "_" + newroom;
        }
        var clientsInRoom = findClientsSocketByRoomId(newroom).length;
        if (clientsInRoom == null || clientsInRoom < 4) {
            socket.leave(socket.room);
            socket.join(newroom);
            socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroomStriped);
            socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
            socket.broadcast.to(oldroom).emit('updaterooms', updateRooms(), null);
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
            socket.emit('updaterooms', updateRooms(), newroomStriped);
        }
    });

    socket.on('disconnect', function() {
        /*
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        */
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});

// Listen for games
http.listen(portGame, function(){
    console.log("Listening on *:" + portGame);
});

function updateRooms()
{
    var roomList = [];
    for (var key in io.sockets.adapter.rooms)
    {
        if (key.toString().indexOf("_") == 0)
        {
            if (findClientsSocketByRoomId(key).length < 4)
                roomList.push(key.toString().split("_")[1]);
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