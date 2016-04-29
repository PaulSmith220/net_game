Array.prototype.getBy = function(key, value) {
    var key_embedded_array = key.split('.');
    var tmp = '';
    var fieldToSearch = null;
    function diveDeeper(currentObj, keyNumber) {
        return currentObj[key_embedded_array[keyNumber]];
    }
    for (var i = 0; i < this.length; i++ ){
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

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
            || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());