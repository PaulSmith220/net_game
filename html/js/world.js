var _World = function() {
    this.width = 1024;
    this.height = 768;
    this.players = [];
    this.connection = null;
    this.connected = false;
    this.myPlayer = null;
    this.canvas = document.getElementById("game");
    this.context = this.canvas.getContext('2d');
};

_World.prototype.connect = function(server, callback) {
    this.connection = io(server);
    var that = this;
    this.connection.on('connect', function() {
        console.info("Connected to server");
        that.connected = true;
        if (callback) {
            callback();
        }
    });
    this.connection.on('your-player-registered', function(data) {
        that.myPlayer.id = data.id;
        console.log(data);
        that.myPlayer.radius = data.player.radius;
        that.myPlayer.position = data.player.position;
        that.myPlayer.enabled = true;
        that.players.push(that.myPlayer);
        that.myPlayer.setUpdate(that, 10);
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
                   p_in_world.position = p.position;
                   p_in_world.speed = p.speed;
               } else {
                   p_in_world.position = p.position;
               }
           }
       });
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
    world.context.fillStyle = "black";
    world.context.fillRect(0, 0, world.width, world.height);
    world.players.reverse().forEach(function(p) {
        with (world.context) {
            fillStyle = p.color;
            beginPath();
            arc(p.position.x, p.position.y, p.radius, 0, Math.PI*2);
            fill();
        }
    });
};

_World.prototype.keyPressed = function(key) {
    if (key == "ArrowLeft") {
        this.myPlayer.move("left");
    }
    if (key == "ArrowRight") {
        this.myPlayer.move("right");
    }
    if (key == "ArrowUp") {
        this.myPlayer.move("up");
    }
    if (key == "ArrowDown") {
        this.myPlayer.move("down");
    }
};

_World.prototype.updateInput = function() {
    var that = this;
    this.players.forEach(function(p) {
        p.updateMove(that);
    });
};

_World.prototype.update = function() {
    this.updateInput();
};