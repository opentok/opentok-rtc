/* global Modal, showTos */

!(function (global) {
  'use strict';

  var room,
    user,
    enterButton,
    form,
    roomLabelElem,
    userLabelElem,
    errorMessage;

  var EJS = function (aTemplateOptions) {
    if (aTemplateOptions.url) {
      this._templatePromise =
        global.Request.sendXHR('GET', aTemplateOptions.url, null, null, 'text')
          .then(function (aTemplateSrc) {
            return global.ejs.compile(aTemplateSrc, { filename: aTemplateOptions.url });
          });
    } else {
      this._templatePromise = Promise.resolve(exports.ejs.compile(aTemplateOptions.text));
    }
    this.render = function (aData) {
      return this._templatePromise.then(function (aTemplate) {
        return aTemplate(aData);
      });
    };
  };

  var loadTosTemplate = function () {
    return new Promise(function (resolve) {
      if (showTos) {
        var tosTemplate = new EJS({ url: '/templates/tos.ejs' });
        tosTemplate.render().then(function (aHTML) {
          document.body.innerHTML += aHTML;
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  var init = function () {
    loadTosTemplate().then(function () {
      enterButton = document.getElementById('enter');
      room = document.getElementById('room');
      user = document.getElementById('user');
      form = document.querySelector('form');
      roomLabelElem = document.getElementById('room-label');
      userLabelElem = document.getElementById('user-label');
      errorMessage = document.querySelector('.error-room');
      resetForm();
      addHandlers();
      if (window.location.hostname.indexOf('opentokrtc.com') === 0) {
        document.querySelector('.safari-plug').style.display = 'block';
      }
    });
  };

  var isValid = function () {
    var formValid = true;

    var fields = document.querySelectorAll('form input.required');

    Array.prototype.map.call(fields, function (field) {
      errorMessage = document.querySelector('.error-' + field.id);
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
      room.addEventListener('keyup', onKeyup);
      room.addEventListener('focus', onFocus);
      user.addEventListener('focus', onFocus);
    });
  };

  var onKeyup = function () {
    roomLabelElem.classList.add('visited');
    room.removeEventListener('keyup', onFocus);
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

      if (!isValid()) {
        form.classList.add('error');
        room.blur();
        document.getElementById('room-label').style.opacity = 0;
        return;
      }

      form.classList.remove('error');
      enterButton.removeEventListener('click', onEnterClicked);

      if (showTos) {
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
    room.addEventListener('keypress', function onKeypress() {
      errorMessage.classList.remove('show');
    });
  };

  global.LandingView = {
    init: init
  };
}(this));
