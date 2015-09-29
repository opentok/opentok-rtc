!function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend'

  var init = function() {
    addHandlers();
  };

  var addHandlers = function() {
    var handler = document.getElementById('handler');

    handler.addEventListener('click', function(e) {
      var dock = document.getElementById('dock');
      dock.classList.toggle('collapsed');
    });
  };

  global.RoomView = {
    init: init
  };

}(this);
