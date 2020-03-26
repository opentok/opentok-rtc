/* global EJSTemplate, Modal, showTos, showUnavailable, roomName, minMeetingNameLength */

!(function (global) {
  'use strict';

  var room,
    user,
    enterButton,
    enterButtonArrow,
    form,
    roomLabelElem,
    userLabelElem,
    errorMessage;

  function htmlEscape(str) {
    return String(str)
      .replace(/&/g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')
      .replace(/</g, '')
      .replace(/>/g, '');
  };

  var loadTosTemplate = function () {
    return new Promise(function (resolve) {
      var tosTemplate = new EJSTemplate({ url: '/templates/tos.ejs' });
      tosTemplate.render().then(function (aHTML) {
        document.body.innerHTML += aHTML;
        resolve();
      });
    });
  };

  var loadUnavailableTemplate = function () {
    return new Promise(function (resolve) {
      var tosTemplate = new EJSTemplate({ url: '/templates/unavailable.ejs' });
      tosTemplate.render().then(function (aHTML) {
        document.body.innerHTML += aHTML;
        resolve();
      });
    });
  };

  var performInit = function () {
    enterButton = document.getElementById('enter');
    enterButtonArrow = document.getElementById('enter-arrow');
    room = document.getElementById('room');
    user = document.getElementById('user');
    form = document.querySelector('form');
    roomLabelElem = document.getElementById('room-label');
    userLabelElem = document.getElementById('user-label');
    errorMessage = document.querySelector('.error-room');
    resetForm();
    roomLabelElem.classList.add('visited');
    room.value = roomName;
    addHandlers();
    if (window.location.hostname.indexOf('opentokrtc.com') === 0) {
      document.querySelector('.safari-plug').style.display = 'block';
    }
  };

  var init = function () {
    if (showUnavailable) {
      loadUnavailableTemplate().then(performInit);
    } else if (showTos) {
      loadTosTemplate().then(performInit);
    } else {
      performInit();
    }
  };

  var isValid = function () {
    var formValid = true;

    if (room.value.length < minMeetingNameLength) {
      var messageText = (room.value.length === 0) ?
        'Please enter a meeting name' :
        'The meeting name must be at least ' + minMeetingNameLength + ' characters';
      errorMessage.querySelector('span').innerHTML = messageText;
      errorMessage.classList.add('show');
      formValid = false;
    }

    return formValid;
  };

  var resetForm = function () {
    var fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, function (field) {
      field.value = '';
      field.checked = false;
      user.focus();
      user.addEventListener('keyup', onKeyup);
      room.addEventListener('focus', onFocus);
      user.addEventListener('focus', onFocus);
    });
  };

  var onKeyup = function () {
    userLabelElem.classList.add('visited');
    user.removeEventListener('keyup', onFocus);
  };

  var onFocus = function () {
    if (this.id === 'room') {
      errorMessage.classList.remove('show');
      document.getElementById('room-label').style.opacity = 1;
      roomLabelElem.classList.add('visited');
      if (document.getElementById('user').value.length === 0) {
        userLabelElem.classList.remove('visited');
      }
    } else {
      userLabelElem.classList.add('visited');
      if (document.getElementById('room').value.length === 0) {
        roomLabelElem.classList.remove('visited');
      }
    }
  };

  var showUnavailableMessage = function () {
    var selector = '.tc-modal.unavailable';
    return Modal.show(selector);
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
    var url = window.location.origin
      .concat('/room/', encodeURIComponent(htmlEscape(room.value)));
    var userName = encodeURIComponent(htmlEscape(user.value.trim()));
    if (userName) {
      url = url.concat('?userName=', userName);
    }
    resetForm();
    window.location.href = url;
  };

  var triggerEnterClick = function(event) {
    var code = event.keyCode || event.which;

    if (code === 13) {
      event.preventDefault();
      enterButton.click();
    }
  }

  var addHandlers = function () {
    var enterRoomButtons = document.querySelectorAll('.enter-room-buttons');

    enterRoomButtons.forEach((button) => {
      button.addEventListener('click', function onEnterClicked(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    
        if (!isValid()) {
          form.classList.add('error');
          room.blur();
          document.getElementById('room-label').style.opacity = 0;
          return;
        }
    
        form.classList.remove('error');
        button.removeEventListener('click', onEnterClicked);
    
        if (showUnavailable) {
          showUnavailableMessage();
        } else if (showTos) {
          showContract().then(function (accepted) {
            if (accepted) {
              sessionStorage.setItem('tosAccepted', true);
              navigateToRoom();
            } else {
              addHandlers();
            }
          });
        } else {
          navigateToRoom();
        }
      });
    });

    room.addEventListener('keypress', function onKeypress() {
      errorMessage.classList.remove('show');
    });

    room.addEventListener("keydown", triggerEnterClick, false);

    user.addEventListener("keydown", triggerEnterClick, false);
  };

  global.LandingView = {
    init: init
  };
}(this));
