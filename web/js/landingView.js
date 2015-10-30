!function(global) {
  'use strict';

  var room, enterButton;

  var init = function() {
    enterButton = document.getElementById('enter');
    room = document.getElementById('room');
    resetForm();
    addHandlers();
  };

  var onInput = function() {
    enterButton.disabled = !room.value.trim();
  };

  var resetForm = function() {
    var fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, function(field) {
      field.value = '';
    });
    enterButton.disabled = true;
  };

  var addHandlers = function() {
    var form = document.querySelector('form');
    form.addEventListener('input', onInput);

    enterButton.addEventListener('click', function onEnterClicked(event) {
      event.preventDefault();
      enterButton.removeEventListener('click', onEnterClicked);
      form.removeEventListener('input', onInput);
      var base = window.location.href.replace('index.html', '');
      var url = base.concat('room/', room.value);
      var userName = document.getElementById('user').value.trim();
      if (userName) {
        url = url.concat('?userName=', userName);
      }
      resetForm();
      window.location = url;
    });
  };

  global.LandingView = {
    init: init
  };

}(this);
