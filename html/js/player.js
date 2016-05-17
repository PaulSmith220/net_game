var _Player = function() {
    this.nickName = 'player_' + Math.random();
    this.id = null;
    this.position = {x: 200, y: 200};
    this.speed = {x: 0, y: 0};
    this.radius = 10;
    this.maxSpeed = 25;
    this.speedStep = 0.3;
    this.speedDecreaseStep = 0.05;
    this.enabled = false;
    this.color = ["orange", "lime", "white", "green", "blue"][Math.floor(Math.random() * 5)];
    this.updateInterval = null;
    this.moveDir = {
        x: null,
        y: null
    };

    this.bulletSpeed = 30;
    this.reloadTime = 200;
    this.reloading = false;
    this.angle = 0;
    this.coins = 0;

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

    this.speed.x = Math.sign(this.speed.x) * (Math.abs(this.speed.x) - this.speedDecreaseStep);
    this.speed.y = Math.sign(this.speed.y) * (Math.abs(this.speed.y) - this.speedDecreaseStep);

    this.position.y += this.speed.y;
    if (this.position.y < 0 + this.radius) {
        this.position.y = this.radius;
        this.speed.y = -this.speed.y * 0.5;
    }
    if (this.position.y > world.height - this.radius) {
        this.position.y = world.height - this.radius;
        this.speed.y = -this.speed.y * 0.5;
    }

    this.position.x += this.speed.x;
    if (this.position.x < 0 + this.radius) {
        this.position.x = this.radius;
        this.speed.x = -this.speed.x*0.5;
    }
    if (this.position.x > world.width- this.radius) {
        this.position.x = world.width - this.radius;
        this.speed.x = -this.speed.x*0.5;
    }

    //this.moveDir = {
    //    x: null,
    //    y: null
    //};
};

_Player.prototype.updatePositionFromServer = function(sPos) {
    if (sPos) {
        var distance = getDistance(this.position, sPos);
        if (distance < this.maxSpeed) {
            return;
        }
        if (distance < this.maxSpeed * 10) {
            this.speed.x -= (this.position.x - sPos.x) * this.speedStep * this.speedStep;
            this.speed.y -= (this.position.y - sPos.y) * this.speedStep * this.speedStep;
        } else {
            this.position = sPos;
        }
    }
};

_Player.prototype.shoot = function(pos, angle) {
    if (!this.reloading) {
        var bullet = {
            position: {
                x: pos.x,
                y: pos.y,
            },
            player: this.id,
            color: this.color,
            speed: {
                y: this.bulletSpeed * Math.cos(angle + Math.PI / 2),
                x: this.bulletSpeed * Math.sin(angle + Math.PI / 2)
            },
            lifetime: 1000
        };

        World.connection.emit('player-shoot', bullet);

        this.reloading = true;
        var that = this;
        setTimeout(function() {
            that.reloading = false;
        }, that.reloadTime);
    }

};