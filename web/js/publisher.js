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
          var button = (evt.type === 'roomController:video') ? videoCtrlBtn : audioCtrlBtn;
          HTMLElems.setEnabled(button, evt.detail.enabled);
        }
        break;
    }
  }

  var publisher,
      videoCtrlBtn,
      audioCtrlBtn;

  function addControlBtns() {
    var controls = HTMLElems.createElementAt(publisher, 'div');
    controls.classList.add('controls');

    var buttons = HTMLElems.createElementAt(controls, 'div');
    buttons.classList.add('buttons');

    videoCtrlBtn = HTMLElems.createElementAt(buttons, 'i',
                     {'data-icon': 'camera', 'data-action': 'video'});
    videoCtrlBtn.classList.add('enabled');
    audioCtrlBtn = HTMLElems.createElementAt(buttons, 'i',
                     {'data-icon': 'micro', 'data-action': 'audio'});
    audioCtrlBtn.classList.add('enabled');

    HTMLElems.createElementAt(publisher, 'i', {'data-icon': 'record'});
  }

  function init() {
    publisher = document.getElementById('publisher');
    addControlBtns();
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
