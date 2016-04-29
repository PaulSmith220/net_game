var _Player = function() {
    this.nickName = 'player_' + Math.random();
    this.id = null;
    this.position = {x: 200, y: 200};
    this.speed = {x: 0, y: 0};
    this.radius = 10;
    this.maxSpeed = 10;
    this.speedStep = 0.1;
    this.enabled = false;
    this.color = ["orange", "lime", "white", "yellow", "green", "blue"][Math.floor(Math.random() * 6)];
    this.updateInterval = null;
    this.moveDir = {
        x: null,
        y: null
    };
};

_Player.prototype.register = function(world) {
    world.connection.emit('player-registration', {player: this, w: world.width, h: world.height});

};

_Player.prototype.setUpdate = function(world, timer) {
  var that = this;
    that.updateInterval = setInterval(function() {
        world.connection.emit('player-update', that);
    }, timer);
};

_Player.prototype.move = function(dir) {
    if (dir == "up" || dir == "down")
        this.moveDir.y = dir;

    if (dir == "left" || dir == "right")
        this.moveDir.x = dir;
};

_Player.prototype.updateMove = function(world) {
    if (this.moveDir.y == "up") {
        this.speed.y -= this.speedStep;
        if (this.speed.y < -this.maxSpeed) {
            this.speed.y = -this.maxSpeed;
        }
    }
    if (this.moveDir.y == "down") {
        this.speed.y += this.speedStep;
        if (this.speed.y > this.maxSpeed) {
            this.speed.y = this.maxSpeed;
        }
    }
    if (this.moveDir.x == "left") {
        this.speed.x -= this.speedStep;
        if (this.speed.x < -this.maxSpeed) {
            this.speed.x = -this.maxSpeed;
        }
    }
    if (this.moveDir.x == "right") {
        this.speed.x += this.speedStep;
        if (this.speed.x > this.maxSpeed) {
            this.speed.x = this.maxSpeed;
        }
    }

    this.position = this.position || {x:200, y:200};
    this.speed = this.speed || {x: 0, y: 0};

    this.position.y += this.speed.y;
    if (this.position.y < 0 + this.radius) {
        this.position.y = this.radius;
        this.speed.y = 0;
    }
    if (this.position.y > world.height - this.radius) {
        this.position.y = world.height - this.radius;
        this.speed.y = 0;
    }

    this.position.x += this.speed.x;
    if (this.position.x < 0 + this.radius) {
        this.position.x = this.radius;
        this.speed.x = 0;
    }
    if (this.position.x > world.width- this.radius) {
        this.position.x = world.width - this.radius;
        this.speed.x = 0;
    }

    this.moveDir = {
        x: null,
        y: null
    };
};