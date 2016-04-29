var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(80);

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
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}

var players = [];

io.on('connection', function (socket) {
    socket.on('disconnect', function() {
        io.emit({title: 'client disconnected', data: arguments});
    });

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
    });

    socket.on('player-update', function(data) {
        var player = players.getBy('socket', socket);
        player.player = data;
    });


    socket.on('disconnect', function() {
        var player = players.getBy('socket', socket);
        var index = players.indexOf(player);
        if (index != -1) {
            io.emit('player-disconnected', player.player.id);
            players.splice(index, 1);
        }
    });

    setInterval(function(){
        io.emit('players-data', players.map(function(p) {
            return p.player;
        }))
    }, 100);

    setInterval(function() {
        console.log("Players: " + players.length);
        players.forEach(function(p) {
           console.log(" - " + p.player.id);
        });
    }, 5000);
});


