var port = 1070;

for (var i = 0; i < process.argv.length; i++)
{
    var split = process.argv[i].split("=");
    if (split.length == 2)
    {
        if (split[0] == "port")
        {
            port = parseInt(split[1]);
        }
    }
}

var redis = require("redis");
var client = redis.createClient(6379, "localhost");

client.on("error", function (err) {
    console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

if (port == 1070)
{
    client.set("kljuc1", "vrijednost 1; " + port.toString());
}

client.get("kljuc1", function (err, reply) {
    console.log(reply.toString());
});