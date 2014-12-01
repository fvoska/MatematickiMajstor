// Listen on port 8080.
var io = require('socket.io').listen(8080);
var clients = [];

// Removal of items from Array.
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};

// Get socket on client connection.
io.sockets.on('connection', function (socket) {
    // Dodaj klijentov socket u polje.
    clients.push(socket);
    console.log("New client connected. Current number of clients: " + clients.length);

    // Osluškujemo na događaje koje nam šalje klijent
    socket.on('clientEvent', function (data) {
        // Ispišemo u konzolu
        var json = JSON.parse(data)
        console.log("Client replied with his time: " + json.clientTime);
        console.log(json.userAgent);
    });

    socket.on('disconnect', function() {
        console.log('One client disconnected! Removing him from clients array...');
        var i = clients.indexOf(socket);
        clients.remove(i);
        console.log("Current number of clients: " + clients.length);
    });
});

// Svakih 2s šaljemo klijentima serverTimeTick event na koji klijenti odgovaraju svojim vremenom i user agentom
setInterval(function(){
    console.log("\nSending serverTime to " + clients.length + " clients...");
    /*var i;
    for (i = 0; i < clients.length; i++)
    {
        var now = new Date();
        var jsonDate = now.toJSON();
        clients[i].emit('serverTimeTick', JSON.stringify({ serverTime: jsonDate }));
    }*/
    var now = new Date();
    var jsonDate = now.toJSON();
    io.emit('serverTimeTick', JSON.stringify({ serverTime: jsonDate }));
}, 5000);