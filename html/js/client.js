var fps = 30;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

window.onload = function() {
    World = new _World();
    World.connect('http://localhost', function() {
        World.addMyPlayer();
    });

    frame();
};

window.addEventListener('keydown', function(e) {
    World.keyPressed(e.code);
});

function frame() {
    requestAnimationFrame(frame);

    now = Date.now();
    delta = now - then;

    if (delta > interval) {
        World.update();
        then = now - (delta % interval);

        // ... Code for Drawing the Frame ...
        World.drawPlayers();
    }


}