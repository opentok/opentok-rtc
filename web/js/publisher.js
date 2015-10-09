!function(global) {
  'use strict';

  var isTouch = 'ontouchstart' in global;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';
  var videoCtrlBtn;

  var getTouch = (function getTouchWrapper() {
    return isTouch ? function(e) { return e.touches[0] } :
                     function(e) { return e };
  })();

  var setTransform = function(transform) {
    publisherStyle.MozTransform = publisherStyle.webkitTransform =
      publisherStyle.msTransform = publisherStyle.transform = transform;
  };

  function handleEvent(evt) {
    switch (evt.type) {
      case touchstart:
        publisher.removeEventListener(touchstart, handleEvent, true);
        global.addEventListener(touchmove, handleEvent);
        global.addEventListener(touchend, handleEvent);

        publisher.classList.add('dragging');

        break;

      case touchmove:
        var touch = getTouch(evt);
        setTransform('translate('.concat(touch.pageX - centerX, 'px,',
                      touch.pageY - centerY, 'px)'));

        break;

      case touchend:
        publisher.addEventListener(touchstart, handleEvent, true);
        global.removeEventListener(touchmove, handleEvent);
        global.removeEventListener(touchend, handleEvent);

        publisher.classList.remove('dragging');

        break;
      case 'click':
        videoCtrlBtn.classList.toggle('enabled');
        var newEvt = new CustomEvent('roomView:pubButtonClick', {
          detail: {
            name: 'video'
          }
        });
        global.dispatchEvent(newEvt);
        break;
    }
  }

  var publisher, publisherStyle;

  var centerX, centerY;

  function addControlBtns() {
    videoCtrlBtn = HTMLElems.createElementAt(publisher, 'i', {'data-icon': 'camera'});
    videoCtrlBtn.classList.add('enabled');
  }

  function init() {
    publisher = document.getElementById('publisher');
    publisherStyle = publisher.style;
    addControlBtns();
    var rectObject = publisher.getBoundingClientRect();
    centerX = rectObject.left + (rectObject.width / 2);
    centerY = rectObject.top + (rectObject.height / 2);

    publisher.addEventListener(touchstart, handleEvent, true);
    publisher.addEventListener('click', handleEvent);
  }

  global.Publisher = {
    init: init
  };

}(this);
