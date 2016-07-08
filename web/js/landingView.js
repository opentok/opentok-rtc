!function(global) {
  'use strict';

  var room, terms, adult, enterButton;

  var init = function() {
    enterButton = document.getElementById('enter');
    terms = document.getElementById('terms');
    adult = document.getElementById('adult');
    room = document.getElementById('room');
    resetForm();
    addHandlers();
  };

  var isValid = function() {
    var formValid = true;

    var fields = document.querySelectorAll('form input.required');

    Array.prototype.map.call(fields, function(field) {
      var errorMessage = document.querySelector('.error-' + field.id);
      var valid = field.type === 'checkbox' ? field.checked : field.value.trim();
      valid ? errorMessage.classList.remove('show') : errorMessage.classList.add('show');
      formValid = formValid && valid;
    });

    return formValid;
  };

  var resetForm = function() {
    var fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, function(field) {
      field.value = '';
      field.checked = false;
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
      var base = window.location.href.replace(/([^\/]+)\.[^\/]+$/, '');
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
