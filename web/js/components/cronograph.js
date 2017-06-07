!(function(exports) {
  'use strict';

  var cronographElement;
  var counter = 0;
  var counterTimer = null;

  function beautify(value) {
    return (value < 10) ? ('0' + value) : value;
  }

  function reset(text) {
    counter = 0;
    cronographElement && paint(text);
  }

  function paint(text) {
    if (!text) {
      var minutes = Math.floor(counter / 60);
      var seconds = Math.floor(counter % 60);
      text = beautify(minutes) + ':' + beautify(seconds);
    }

    cronographElement.textContent = text;
  }

  var Cronograph = {
    /**
     * It initializes the cronograph.
     *
     * {initialText} Optional text which will be displayed before starting.
     */
    init: function(initialText) {
      cronographElement = document.querySelector('.duration');
      reset(initialText);
      return this;
    },

    /**
     * It starts the cronograph from 0 by default.
     *
     * {from} This param sets the seconds from where the cronograph will start
     *        counting.
     */
    start: function(from) {
      if (counterTimer !== null) {
        return this;
      }
      counter = Math.max(from || 0, 0);
      counterTimer = setInterval(function() {
        ++counter;
        paint();
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
}(this));
