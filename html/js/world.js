var _World = function() {
    this.width = 1024;
    this.height = 768;
    this.players = [];
    this.connection = null;
    this.connected = false;
    this.myPlayer = null;
    this.canvas = document.getElementById("game");
    this.context = this.canvas.getContext('2d');
    this.coins = [];
    this.mousePos = {x:0, y:0};
    this.canvasOffset = {
        x: document.getElementById('game').offsetLeft,
        y: document.getElementById('game').offsetTop
    };
    this.bullets = [];
};

_World.prototype.connect = function(server, callback) {
    //this.connection = location.host.indexOf('localhost') == -1 ? io.connect("/") : io(server);
    this.connection = io.connect("/");
    var that = this;
    this.connection.on('connect', function() {
        console.info("Connected to server");
        that.connected = true;
        if (callback) {
            callback();
        }
    });

    this.connection.on('disconnect', function() {
        alert('Вы были отключены от сервера');
        location.reload();
    });

    this.connection.on('world-params', function(data) {
        that.width = data.size.width;
        that.height = data.size.height;

        that.coins = data.coins;

        that.bullets;

    });

    this.connection.on('your-player-registered', function(data) {
        that.myPlayer.id = data.id;
        console.log(data);
        that.myPlayer.radius = data.player.radius;
        that.myPlayer.position = data.player.position;
        that.myPlayer.enabled = true;
        that.players.push(that.myPlayer);
        that.myPlayer.setUpdate(that, 1);
        console.info("My player registered");
        document.getElementById("color").style.backgroundColor = that.myPlayer.color;
    });

    this.connection.on('player-registered', function(data) {
        var newPlayer = new _Player();
        newPlayer.id = data.id;
        console.log(data);
        newPlayer.nickName = data.nickName;
        newPlayer.position = data.position;
        newPlayer.speed = data.speed;
        newPlayer.radius = data.radius;
        newPlayer.color = data.color;
        newPlayer.enabled = true;
        that.players.push(newPlayer);
        //newPlayer.setUpdate(that, 10);
        console.info("New player added to the world");
        console.log(that.players, that.myPlayer);
    });

    this.connection.on('player-disconnected', function(id) {
        var pl = that.players.getBy('id', id);
        if (pl != null) {
            console.info("Player " + pl.nickName + " disconnected");
            var index = that.players.indexOf(pl);
            if (index != -1) {
                that.players.splice(index, 1);
            }
        }
    });

    this.connection.on('players-data', function(pls) {
        pls.forEach(function(p) {
            var p_in_world = that.players.getBy('id', p.id);
            if (p_in_world != null) {
                if (p.id != that.myPlayer.id) {
                    p_in_world.updatePositionFromServer(p.position);
                    p_in_world.speed = p.speed;
                    p_in_world.angle = p.angle;
                } else {
                    p_in_world.updatePositionFromServer(p.position);
                }
            }
        });
    });

    this.connection.on('new-bullet', function(bullet) {
        that.bullets.push(bullet);
    });

    this.connection.on('dead-bullet', function(bullet) {
        var index = that.bullets.indexOf(that.bullets.getBy('id', bullet.id));
        if (index != -1) {
            that.bullets.splice(index, 1);
        }
    });

    this.connection.on('player-hitted', function(id) {
       var pl = that.players.getBy('id', id);
        pl.speed.x = 0;
        pl.speed.y = 0;
    });
};

_World.prototype.addMyPlayer = function() {
    if (this.myPlayer == null) {
        this.myPlayer = new _Player();
        this.myPlayer.register(this);
    } else {
        throw Error("Already has a myPlayer");
    }
};

_World.prototype.drawPlayers = function() {
    var world = this;
    world.myPlayer.angle = -getAngle(world.myPlayer.position,
        {
            x: world.mousePos.x - world.canvasOffset.x,
            y: world.mousePos.y - world.canvasOffset.y,
        }
    );


    world.context.fillStyle = "black";
    world.context.fillRect(0, 0, world.width, world.height);
    world.players.reverse().forEach(function(p) {
        with (world.context) {
            fillStyle = p.color;
            beginPath();
            arc(p.position.x, p.position.y, p.radius, 0, Math.PI*2);
            fill();
            fillStyle = 'black';
            beginPath();
            arc(p.position.x, p.position.y, p.radius*0.8, Math.PI*2 - p.angle - 1, Math.PI*2 - p.angle +1);
            fill();
        }
    });
};

_World.prototype.drawCoins = function() {
    var world = this;
    world.context.fillStyle = 'yellow';
    world.coins.forEach(function(coin) {
        world.context.beginPath();
        world.context.arc(coin.x, coin.y, coin.size || 10, 0, Math.PI*2);
        world.context.fill();
    });
};

_World.prototype.drawBullets = function() {
    var world = this;
    world.bullets.forEach(function(b) {
        world.context.fillStyle = b.color || 'red';
        world.context.beginPath();
        world.context.arc(b.position.x, b.position.y, 5, 0, Math.PI*2);
        world.context.fill();
    });

};

_World.prototype.drawStats = function() {
    this.context.font = "18px Arial";
    this.fillStyle = 'white';
    this.context.fillText("Coins: " + this.myPlayer.coins,10,30);
};

_World.prototype.checkMyPlayerCoinIntersection = function() {
    var that = this;
    that.coins.forEach(function(coin) {
        if (getDistance(coin, that.myPlayer.position) <= coin.size * 2) {
            console.log("CHECK");
            that.collectCoin(coin);
            that.myPlayer.coins++;
        }
    });
};

_World.prototype.checkMyPlayerBulletIntersection = function() {
  var that = this;
    that.bullets.forEach(function(bullet) {
       if (bullet.player != that.myPlayer.id) {
            if (getDistance(bullet.position, that.myPlayer.position) <= that.myPlayer.radius*2) {
                that.connection.emit('player-bullet-hit', {player: that.myPlayer.id, bullet: bullet.id});
                that.myPlayer.coins -= 5;
                if (that.myPlayer.coins < 0) {
                    that.myPlayer.coins = 0;
                }
            }
       }
    });
};

_World.prototype.collectCoin = function (coin) {
    this.connection.emit("coin-collected", coin);
};

_World.prototype.keyPressed = function(key) {
    if (key == "ArrowLeft" || key == "KeyA") {
        this.myPlayer.move("left");
    }
    if (key == "ArrowRight" || key == "KeyD") {
        this.myPlayer.move("right");
    }
    if (key == "ArrowUp" || key == "KeyW") {
        this.myPlayer.move("up");
    }
    if (key == "ArrowDown" || key == "KeyS") {
        this.myPlayer.move("down");
    }

    if (key == "Space") {
        this.myPlayer.shoot(this.myPlayer.position, this.myPlayer.angle);
    }
};

_World.prototype.keyUp = function(key) {
    if (key == "ArrowLeft" || key == "ArrowRight" || key == "KeyA" || key == "KeyD") {
        this.myPlayer.moveDir.x = null;
    }
    if (key == "ArrowUp" || key == "ArrowDown" || key == "KeyW" || key == "KeyS") {
        this.myPlayer.moveDir.y = null;
    }
};

_World.prototype.updateInput = function() {
    var that = this;
    this.players.forEach(function(p) {
        p.updateMove(that);
    });
};

_World.prototype.updateBullets = function() {
    this.bullets.forEach(function(bullet) {
        bullet.position.x += bullet.speed.x;
        bullet.position.y += bullet.speed.y;
    });
};


_World.prototype.update = function() {
    this.updateInput();
    this.updateBullets();
};