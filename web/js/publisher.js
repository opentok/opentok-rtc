!function(global) {
  'use strict';

  function handleEvent(evt) {
    switch (evt.type) {
      case 'click':
        var elem = evt.target;
        if (!(HTMLElems.isAction(elem))) {
          return;
        }
        elem.classList.toggle('enabled');
        Utils.sendEvent('roomView:pubButtonClick', { name: elem.dataset.action });

        break;
    }
  }

  var publisher;

  function addControlBtns() {
    var videoCtrlBtn = HTMLElems.createElementAt(publisher, 'i',
                     {'data-icon': 'camera', 'data-action': 'video'});
    videoCtrlBtn.classList.add('enabled');
    HTMLElems.createElementAt(publisher, 'i', {'data-icon': 'record'});
  }

  function init() {
    publisher = document.getElementById('publisher');
    addControlBtns();
    publisher.addEventListener('click', handleEvent);
  }

  global.Publisher = {
    init: init
  };

}(this);
