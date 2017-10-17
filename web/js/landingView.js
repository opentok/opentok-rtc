/* global Modal, isWebRTCVersion */

!(function (global) {
  'use strict';

  var room,
    user,
    enterButton;

  var init = function () {
    enterButton = document.getElementById('enter');
    room = document.getElementById('room');
    user = document.getElementById('user');
    resetForm();
    addHandlers();
    if (window.location.hostname.indexOf('opentokrtc.com') === 0) {
      document.querySelector('.safari-plug').style.display = 'block';
    }
  };

  var isValid = function () {
    var formValid = true;

    var fields = document.querySelectorAll('form input.required');

    Array.prototype.map.call(fields, function (field) {
      var errorMessage = document.querySelector('.error-' + field.id);
      var valid = field.type === 'checkbox' ? field.checked : field.value.trim();
      valid ? errorMessage.classList.remove('show') : errorMessage.classList.add('show');
      formValid = formValid && valid;
    });

    return formValid;
  };

  var resetForm = function () {
    var fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, function (field) {
      field.value = '';
      field.checked = false;
      room.focus();
      room.addEventListener('focus', animateLabel);
      room.addEventListener('keypress', animateLabel);
      user.addEventListener('focus', animateLabel);
    });
  };

  var animateLabel = function () {
    document.getElementById(this.id + '-label').classList.add('visited');
  };

  var showContract = function () {
    var selector = '.tc-modal.contract';
    var acceptElement = document.querySelector(selector + ' .accept');

    return Modal.show(selector)
      .then(function () {
        return new Promise(function (resolve) {
          acceptElement.addEventListener('click', function onClicked(evt) {
            acceptElement.removeEventListener('click', onClicked);
            resolve(true);
            evt.preventDefault();
            Modal.hide(selector);
          });

          Utils.addEventsHandlers('modal:', {
            close: function () {
              resolve();
            }
          });
        });
      });
  };

  var navigateToRoom = function () {
    var base = window.location.href.replace(/([^/]+)\.[^/]+$/, '');
    var url = base.concat('room/', encodeURIComponent(room.value));
    var userName = encodeURIComponent(user.value.trim());
    if (userName) {
      url = url.concat('?userName=', userName);
    }
    resetForm();
    window.location.href = url;
  };

  var addHandlers = function () {
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
        showContract().then(function (accepted) {
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
