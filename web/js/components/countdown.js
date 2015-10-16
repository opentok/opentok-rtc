!function(exports) {
  'use strict';

  var countdownElement;
  var counter = 0;
  var counterTimer = null;

  function beautify(value) {
    return (value < 10) ? ('0' + value) : value;
  }

  function reset() {
    counter = 0;
    paint(0, 0);
  }

  function paint(minutes, seconds) {
    countdownElement.textContent = beautify(minutes) + ':' + beautify(seconds);
  }

  var Countdown = {
    init: function () {
      countdownElement = document.querySelector('.duration');
      reset();
      return this;
    },
    start: function(element) {
      if (counterTimer !== null) {
        return;
      }
      counterTimer = setInterval(function() {
        ++counter;
        var minutes = Math.floor(counter / 60);
        var seconds = Math.floor(counter % 60);
        paint(minutes, seconds);
      }, 1000);
    },
    stop: function() {
      exports.clearInterval(counterTimer);
      counterTimer = null;
      return counter;
    },
    reset: reset
  };

  exports.Countdown = Countdown;

}(this);
