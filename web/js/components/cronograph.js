!function(exports) {
  'use strict';

  var cronographElement;
  var counter = 0;
  var counterTimer = null;

  function beautify(value) {
    return (value < 10) ? ('0' + value) : value;
  }

  function reset() {
    counter = 0;
    cronographElement && paint(0, 0);
  }

  function paint(minutes, seconds) {
    cronographElement.textContent = beautify(minutes) + ':' + beautify(seconds);
  }

  var Cronograph = {
    init: function () {
      cronographElement = document.querySelector('.duration');
      reset();
      return this;
    },
    start: function() {
      if (counterTimer !== null) {
        return;
      }
      counterTimer = setInterval(function() {
        ++counter;
        var minutes = Math.floor(counter / 60);
        var seconds = Math.floor(counter % 60);
        paint(minutes, seconds);
      }, 1000);
      return this;
    },
    stop: function() {
      exports.clearInterval(counterTimer);
      counterTimer = null;
      return this;
    },
    reset: reset
  };

  exports.Cronograph = Cronograph;

}(this);
