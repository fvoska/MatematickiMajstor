var io = require('socket.io').listen(8081);
var redisSockets = require('socket.io-redis');
io.adapter(redisSockets({ host: 'localhost', port: 6379 }));

var usernames = {};

var rooms = { "rooms": ["Lobby"]};

var redisRooms = require("redis");
var client = redisRooms.createClient(6379, "localhost");

client.set("rooms", JSON.stringify(rooms));

io.sockets.on('connection', function(socket) {
    socket.on('adduser', function(username) {
        socket.username = username;
        socket.room = 'Lobby';
        usernames[username] = username;
        socket.join('Lobby');
        socket.emit('updatechat', 'SERVER', 'you have connected to Lobby');
        socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', username + ' has connected to this room');
        client.get("rooms", function (err, reply) {
            rooms = JSON.parse(reply);
        });
        socket.emit('updaterooms', JSON.stringify(rooms), 'Lobby');
    });

    socket.on('create', function(room) {
        client.get("rooms", function (err, reply) {
            rooms = JSON.parse(reply);
        });
        rooms["rooms"].push(room);
        client.set("rooms", JSON.stringify(rooms));
        io.sockets.emit('updaterooms', JSON.stringify(rooms), socket.room);
    });

    socket.on('sendchat', function(data) {
        io.sockets["in"](socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('switchRoom', function(newroom) {
        var oldroom;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        client.get("rooms", function (err, reply) {
            rooms = JSON.parse(reply);
        });
        socket.emit('updaterooms', JSON.stringify(rooms), newroom);
    });

    socket.on('disconnect', function() {
        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});