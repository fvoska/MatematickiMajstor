Matematički Majstor
===================

For course [Distibuted Systems](http://www.fer.unizg.hr/en/course/dissys) at [Faculty of Electrical Engineering and Computing](http://www.fer.unizg.hr).

**Students**:
- Matija Cerovec
- Marko Gudan
- Dino Kačavenda
- Martin Kurtoić
- Filip Voska

#Description
Players compete against other players by solving simple mathematical tasks of addition, subtraction and multiplication. Answers must be correct and quick. To win the game, be the quickest one to answer a set number of tasks correctly.

#Instalation
To run Matematički Majstor, you need Node.js to run game server, MySQL Server for database alongside with PHP Server and your WWW Server of choice for client-side HTML, CSS and JavaScript (ex. you can use Apache for PHP and WWW). Additionally, Node.js requires Redis Server to distribute the load.
##Node.js
1. Download and install Node.js. You can do this [via a Package Manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) or [using an installer/compiling from source](http://nodejs.org/download/).
2. Using [NPM](https://www.npmjs.com/), install following modules and their dependencies:
```sh
npm install express
npm install socket.io
npm install socket.io-redis
```

Run application with:
```sh
node majstor-game-server.js
```
Optionally, you can set Redis host and port and port on which application will listen:
```sh
node majstor-game-server.js portGame=8080 hostRedisSockets=127.0.0.1 portRedisSockets=6379
```
If unset, values will default to the above.

If you want to keep the application running in background, use [Forever](https://github.com/nodejitsu/forever).

##Redis
1. Download and install Redis by following [the instructions](http://redis.io/download).
2. Run Redis. Make sure to configure Node.js application to use correct Redis host and port.

##PHP and WWW Servers
1. Download and install Apache by following [the instructions](http://www.apache.org/dyn/closer.cgi).
2. Make sure you have ```mod_php``` enabled.
3. Copy PHP, HTML, CSS and JS files over to the server.

##MySQL
1. Download and install MySQL by following [the instructions](http://dev.mysql.com/downloads/). Optionally, install [phpMyAdmin](http://www.phpmyadmin.net/home_page/index.php) to manage MySQL more easily.
2. Execute included SQL scripts to create the database and needed tables.

#Version Compatibility

Future updates might break compatibility. Application was developed using the following versions (which are also included in this repository):
- Node.js - 0.10.25
- Express - 4.10.4
- Socket.io - 1.2.1
- Socket.io-Redis - 0.1.4
- Redis - 2.8.18
