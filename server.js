//var app = require('http').createServer(handler)

var url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 80;

var app = require('http').createServer(function(request, response) {

    var uri = url.parse(request.url).pathname
        , filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
        if(!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }

            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
    });
});


app.listen(8080, "0.0.0.0");
//app.listen(8080, "localhost");
var io = require('socket.io')(app);

console.log('Server started');

Array.prototype.getBy = function(key, value) {
    var key_embedded_array = key.split('.');
    var tmp = '';
    var fieldToSearch = null;

    function diveDeeper(currentObj, keyNumber) {
        return currentObj[key_embedded_array[keyNumber]];
    }

    for (var i = 0; i < this.length; i++) {
        var x = this[i];
        for (var k = 0; k < key_embedded_array.length; k++) {
            x = diveDeeper(x, k);
            if (!x || x == undefined) {
                return null;
            }
        }

        if (x && x == value) {
            return this[i];
        }
    }
    return null;
};

function handler (req, res) {
    //res.setHeader('Access-Control-Allow-Origin', '*');
    //res.setHeader('Access-Control-Request-Method', '*');
    //res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    //res.setHeader('Access-Control-Allow-Headers', '*');

    //fs.readFile(__dirname + '/html/index.html',
    //    function (err, data) {
    //        if (err) {
    //            res.writeHead(500);
    //            return res.end('Error loading index.html');
    //        }
    //
    //        res.writeHead(200);
    //        res.end(data);
    //    });
}

var players = [];
var world = {
    size: {
        width: 1024,
        height: 768
    },
    coins: [],
    bullets: []
};

function newCoin() {
    return {
        x: Math.random() * 0.9 * world.size.width,
        y: Math.random() * 0.9 * world.size.height,
        size: 10,
        id: Math.random()
    }
}

for (var i = 0; i < 10; i++) {
    world.coins.push(newCoin());
}

io.on('connection', function (socket) {
    console.log("New connection");

    setTimeout(function() {
        socket.emit('world-params', world);
    }, 500);

    socket.on('clearList', function() {
        players = [];
    });

    socket.on('player-registration', function(data) {
        data.id = Math.random();
        data.player.position = {
            x: Math.floor(Math.random()*data.w),
            y: Math.floor(Math.random()*data.h)
        };
        data.player.radius = 10;
        data.player.color = data.player.color;
        data.player.id = data.id;
        socket.emit('your-player-registered', data);
        players.forEach(function(p){
            socket.emit('player-registered', p.player);
        });
        players.push({socket: socket, player: data});
        socket.broadcast.emit('player-registered', data.player);
        console.log("New player registered: " + data.player.nickName);
    });

    socket.on('player-update', function(data) {
        var player = players.getBy('socket', socket);
        player.player = data;
    });


    socket.on('disconnect', function() {
        console.log('Someone disconnected');
        var player = players.getBy('socket', socket);
        var index = players.indexOf(player);
        if (index != -1) {
            console.log("Player disconnected: " + player.player.nickName);
            io.emit('player-disconnected', player.player.id);
            players.splice(index, 1);
        }
    });

    socket.on('coin-collected', function(coin) {
        var index = world.coins.indexOf(world.coins.getBy('id', coin.id));
        world.coins.splice(index, 1);
        world.coins.push(newCoin());
        io.sockets.emit('world-params', world);
    });

    socket.on('player-shoot', function(bullet) {
        bullet.id = Math.random();
        world.bullets.push(bullet);
        io.sockets.emit('new-bullet', bullet);
        setTimeout(function() {
            destroyBullet(bullet);
        }, bullet.lifetime);
    });

    socket.on('player-bullet-hit', function(data) {
        var player = players.getBy('player.id', data.player),
            bullet = world.bullets.getBy('id', data.bullet);
        destroyBullet(bullet);

        var index = players.indexOf(player);
        players[index].player.speed.x = 0;
        players[index].player.speed.y = 0;
        sendPlayersData();
        io.sockets.emit('player-hitted', data.player);
    });

    setInterval(function(){
        sendPlayersData();
    }, 100);

    setInterval(function() {
        console.log("Players: " + players.length);
        players.forEach(function(p) {
            console.log(" - " + p.player.id);
        });
    }, 5000);
});

function destroyBullet(bullet) {
    var index = world.bullets.indexOf(world.bullets.getBy('id', bullet.id));
    if (index != -1) {
        world.bullets.splice(index, 1);
        io.sockets.emit('dead-bullet', bullet);
    }
};

function sendPlayersData() {
    io.emit('players-data', players.map(function(p) {
        return p.player;
    }))
}