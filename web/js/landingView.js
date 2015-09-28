!function(global) {
  'use strict';

  var room, enterButton;

  var init = function() {
    enterButton = document.getElementById('enter');
    room = document.getElementById('room');

    addHandlers();
  };

  var onInput = function() {
    enterButton.disabled = !room.value.trim();
  };

  var reset = function() {
    var fields = document.querySelectorAll('.join-modal input');
    Array.prototype.map.call(fields, function(field) {
      field.value = '';
    });
    enterButton.disabled = true;
  };

  var addHandlers = function() {
    var join = document.getElementById('join');

    join.addEventListener('click', function(e) {
      Modal.show('.join-modal').then(function() {
        var form = document.querySelector('.join-modal form');
        form.addEventListener('input', onInput);

        enterButton.addEventListener('click', function onEnterClicked(event) {
          event.preventDefault();
          enterButton.removeEventListener('click', onEnterClicked);
          form.removeEventListener('input', onInput);
          Modal.hide('.join-modal').then(reset);
        });
      });
    });
  };

  global.LandingView = {
    init: init
  };

}(this);
