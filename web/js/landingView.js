/* global EJSTemplate, showTos, showUnavailable */

!((global) => {
  let room;
  let user;
  let roomLabelElem;
  let userLabelElem;
  let errorMessage;

  const loadTosTemplate = () => new Promise((resolve) => {
    const tosTemplate = new EJSTemplate({ url: '/templates/tos.ejs' });
    tosTemplate.render().then((aHTML) => {
      document.body.insertAdjacentHTML('afterbegin', aHTML);
      resolve();
    });
  });

  const loadUnavailableTemplate = () => new Promise((resolve) => {
    const tosTemplate = new EJSTemplate({ url: '/templates/unavailable.ejs' });
    tosTemplate.render().then((aHTML) => {
      document.body.insertAdjacentHTML('afterbegin', aHTML);
      resolve();
    });
  });

  const performInit = () => {
    user = document.getElementById('user');
    roomLabelElem = document.getElementById('room-label');
    userLabelElem = document.getElementById('user-label');
    errorMessage = document.querySelector('.error-room');
    resetForm();
    const storedUsername = window.localStorage.getItem('username');
    if (storedUsername && user) {
      user.value = storedUsername;
      userLabelElem.classList.add('visited');
    }
    if (window.location.hostname.indexOf('opentokrtc.com') === 0) {
      document.querySelector('.safari-plug').style.display = 'block';
    }
  };

  const init = () => {
    if (showUnavailable) {
      loadUnavailableTemplate().then(performInit);
    } else if (showTos) {
      loadTosTemplate().then(performInit);
    } else {
      performInit();
    }
  };

  const resetForm = () => {
    const fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, (field) => {
      field.value = '';
      field.checked = false;
      if (user) {
        user.focus();
        user.addEventListener('keyup', onKeyup);
        user.addEventListener('focus', onFocus);
      }
      if (room) room.addEventListener('focus', onFocus);
    });
  };

  const onKeyup = () => {
    userLabelElem.classList.add('visited');
    user.removeEventListener('keyup', onFocus);
  };

  const onFocus = function () {
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

  global.LandingView = {
    init,
  };
})(this);
