!function(global) {
  'use strict';

  function handleEvent(evt) {
    switch (evt.type) {
      case 'click':
        var elem = evt.target;
        if (!(HTMLElems.isAction(elem))) {
          return;
        }

        Utils.sendEvent('roomView:buttonClick', { name: elem.dataset.action });
        break;

      case 'roomController:video':
      case 'roomController:audio':
        if (evt.detail.reason === 'publishVideo' || evt.detail.reason === 'publishAudio') {
          var control = (evt.type === 'roomController:video') ? videoCtrl : audioCtrl;
          HTMLElems.setEnabled(control, evt.detail.enabled);
        }
        break;
    }
  }

  var publisher,
      videoCtrl,
      audioCtrl;

  function addControlBtns() {
    var controls = HTMLElems.createElementAt(publisher, 'div');
    controls.classList.add('controls');

    var buttons = HTMLElems.createElementAt(controls, 'div');
    buttons.classList.add('buttons');

    videoCtrl = HTMLElems.createElementAt(buttons, 'div');
    videoCtrl.classList.add('video-action', 'enabled');
    HTMLElems.createElementAt(videoCtrl, 'i', {'data-icon': 'video', 'data-action': 'video'});

    audioCtrl = HTMLElems.createElementAt(buttons, 'div');
    audioCtrl.classList.add('audio-action', 'enabled');
    HTMLElems.createElementAt(audioCtrl, 'i', {'data-icon': 'mic', 'data-action': 'audio'});

    HTMLElems.createElementAt(publisher, 'i', {'data-icon': 'record'});
  }

  function addAdditionalUI(name) {
    var userInfoElem = HTMLElems.createElementAt(publisher, 'div');
    userInfoElem.classList.add('user-info');

    var nameElem = HTMLElems.createElementAt(userInfoElem, 'div');
    nameElem.classList.add('name');
    nameElem.textContent = name;
  }

  function init(name) {
    publisher = document.getElementById('publisher');
    addControlBtns();
    addAdditionalUI(name);
    publisher.addEventListener('click', handleEvent);
    var events = ['roomController:video', 'roomController:audio'];
    events.forEach(function(name) {
      global.addEventListener(name, handleEvent);
    });
  }

  global.Publisher = {
    init: init
  };

}(this);
