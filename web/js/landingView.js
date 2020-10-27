/* global EJSTemplate, Modal, showTos, showUnavailable, minMeetingNameLength, Utils */

!(global => {
  let room;
  let user;
  let enterButton;
  let form;
  let roomLabelElem;
  let userLabelElem;
  let errorMessage;

  const loadTosTemplate = () => {
    return new Promise(resolve => {
      const tosTemplate = new EJSTemplate({ url: '/templates/tos.ejs' });
      tosTemplate.render().then(aHTML => {
        document.body.insertAdjacentHTML('afterbegin', aHTML);
        resolve();
      });
    });
  };

  const loadUnavailableTemplate = () => {
    return new Promise(resolve => {
      const tosTemplate = new EJSTemplate({ url: '/templates/unavailable.ejs' });
      tosTemplate.render().then(aHTML => {
        document.body.insertAdjacentHTML('afterbegin', aHTML);
        resolve();
      });
    });
  };

  const performInit = () => {
    enterButton = document.getElementById('enter');
    user = document.getElementById('user');
    form = document.querySelector('form');
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

  const isValid = () => {
    let formValid = true;

    if (room.value.length < minMeetingNameLength) {
      const messageText = (room.value.length === 0)
        ? 'Please enter a meeting name'
        : `The meeting name must be at least ${minMeetingNameLength} characters`;
      errorMessage.querySelector('span').innerHTML = messageText;
      errorMessage.classList.add('show');
      formValid = false;
    }

    return formValid;
  };

  var resetForm = () => {
    const fields = document.querySelectorAll('form input');
    Array.prototype.map.call(fields, field => {
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

  var onKeyup = () => {
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

  const showUnavailableMessage = () => {
    const selector = '.tc-modal.unavailable';
    return Modal.show(selector);
  };

  const showContract = () => {
    const selector = '.tc-modal.contract';
    const acceptElement = document.querySelector(`${selector} .accept`);

    return Modal.show(selector)
      .then(() => {
        return new Promise(resolve => {
          acceptElement.addEventListener('click', function onClicked(evt) {
            acceptElement.removeEventListener('click', onClicked);
            resolve(true);
            evt.preventDefault();
            Modal.hide(selector);
          });

          Utils.addEventsHandlers('modal:', {
            close() {
              resolve();
            }
          });
        });
      });
  };

  const navigateToRoom = () => {
    let url = window.location.origin
      .concat('/room/', encodeURIComponent(Utils.htmlEscape(room.value)));
    const userName = encodeURIComponent(Utils.htmlEscape(user.value.trim()));
    if (userName) {
      url = url.concat('?userName=', userName);
    }
    window.location.href = url;
  };

  const triggerEnterClick = event => {
    const code = event.keyCode || event.which;

    if (code === 13) {
      event.preventDefault();
      enterButton.click();
    }
  };

  const addHandlers = () => {
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

      if (showUnavailable) {
        showUnavailableMessage();
      } else if (showTos) {
        showContract().then(accepted => {
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

    room.addEventListener('keydown', triggerEnterClick, false);

    user.addEventListener('keydown', triggerEnterClick, false);
  };

  global.LandingView = {
    init
  };
})(this);
