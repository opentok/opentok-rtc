!function(global) {
  'use strict';

  var room, enterButton;

  var init = function() {
    enterButton = document.getElementById('enter');
    room = document.getElementById('room');
    resetForm();
    addHandlers();
  };

  var isValid = function() {
    return room.value.trim();
  };

  var resetForm = function() {
    var fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, function(field) {
      field.value = '';
    });
  };

  var addHandlers = function() {
    enterButton.addEventListener('click', function onEnterClicked(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      var form = document.querySelector('form');
      if (!isValid()) {
        form.classList.add('error');
        return;
      }

      form.classList.remove('error');
      enterButton.removeEventListener('click', onEnterClicked);
      var base = window.location.href.replace('index.html', '');
      var url = base.concat('room/', room.value);
      var userName = document.getElementById('user').value.trim();
      if (userName) {
        url = url.concat('?userName=', userName);
      }
      resetForm();
      window.location.href = url;
    });
  };

  global.LandingView = {
    init: init
  };

}(this);
