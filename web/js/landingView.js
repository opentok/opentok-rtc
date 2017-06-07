!(function(global) {
  'use strict';

  var room,
    enterButton;

  var init = function() {
    enterButton = document.getElementById('enter');
    room = document.getElementById('room');
    resetForm();
    addHandlers();
    if (window.location.hostname.indexOf('opentokrtc.com') === 0) {
      document.querySelector('.safari-plug').style.display = 'block';
    }
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

  var showContract = function() {
    var selector = '.tc-modal.contract';
    var ui = document.querySelector(selector);

    return Modal.show(selector)
      .then(function() {
        return new Promise(function(resolve, reject) {
          ui.addEventListener('click', function onClicked(evt) {
            var classList = evt.target.classList;
            var hasAccepted = classList.contains('accept');
            if (!hasAccepted && !classList.contains('close')) {
              return;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();
            ui.removeEventListener('click', onClicked);
            Modal.hide(selector).then(function() { resolve(hasAccepted); });
          });
        });
      });
  };

  var navigateToRoom = function() {
    var base = window.location.href.replace(/([^/]+)\.[^/]+$/, '');
    var url = base.concat('room/', room.value);
    var userName = document.getElementById('user').value.trim();
    if (userName) {
      url = url.concat('?userName=', userName);
    }
    resetForm();
    window.location.href = url;
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

      if (isWebRTCVersion) {
        showContract().then(function(accepted) {
          if (accepted) {
            navigateToRoom();
          } else {
            addHandlers();
          }
        });
      } else {
        navigateToRoom();
      }
    });
  };

  global.LandingView = {
    init: init
  };
}(this));
