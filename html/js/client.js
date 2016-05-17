var fps = 30;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

var start = function() {

    document.getElementById('startGameBtn').remove();

    World = new _World();
    window.addEventListener('keydown', function(e) {
        World.keyPressed(e.code);
    });
    window.addEventListener('keyup', function(e) {
        World.keyUp(e.code);
    });

    window.addEventListener('mousemove', function(e) {
       World.mousePos.x = e.clientX;
       World.mousePos.y = e.clientY;
    });

    World.connect(document.getElementById('ip').value, function() {
        World.addMyPlayer();
    });

    frame();
};

connect = function() {
    start();
};


function frame() {
    requestAnimationFrame(frame);

    now = Date.now();
    delta = now - then;

    if (delta > interval) {
        World.update();
        then = now - (delta % interval);

        // ... Code for Drawing the Frame ...
        World.drawPlayers();
        World.drawCoins();
        World.drawBullets();
        World.checkMyPlayerCoinIntersection();
        World.checkMyPlayerBulletIntersection();
        World.drawStats();
    }


}

function getDistance(pos1, pos2) {
    return Math.sqrt( Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2) );
}

function getAngle (p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}