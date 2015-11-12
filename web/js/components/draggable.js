!function(exports) {
  'use strict';

  var isTouch = 'ontouchstart' in exports;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  var getTouch = (function getTouchWrapper() {
    return isTouch ? function(e) { return e.touches[0] } :
                     function(e) { return e };
  })();

  var DraggableElement = function(element) {
    this.element = element;
    this.elementStyle = element.style;

    var rectObject = element.getBoundingClientRect();
    this.centerX = rectObject.left + (rectObject.width / 2);
    this.centerY = rectObject.top + (rectObject.height / 2);

    element.addEventListener(touchstart, this, true);
  };

  DraggableElement.prototype = {
    handleEvent: function(evt) {
      switch (evt.type) {
        case touchstart:
          this.element.removeEventListener(touchstart, this, true);
          exports.addEventListener(touchmove, this);
          exports.addEventListener(touchend, this);

          this.element.classList.add('dragging');

          break;

        case touchmove:
          var touch = getTouch(evt);
          this.setTransform('translate('.concat(touch.pageX - this.centerX, 'px,',
                             touch.pageY - this.centerY, 'px)'));

          break;

        case touchend:
          this.element.addEventListener(touchstart, this, true);
          exports.removeEventListener(touchmove, this);
          exports.removeEventListener(touchend, this);

          this.element.classList.remove('dragging');

          break;
      }
    },

    setTransform: function(transform) {
      Utils.setTransform(this.elementStyle, transform);
    },

    destroy: function() {
      this.element.removeEventListener(touchstart, this, true);
      Utils.setTransform(this.elementStyle, '');
      this.element = null;
      this.elementStyle = null;
    }
  };

  var elements = {};

  var Draggable = {
    on: function(element) {
      element && (elements[element] = new DraggableElement(element));
    },

    off: function(element) {
      var draggableElement = elements[element];
      draggableElement && draggableElement.destroy();
    }
  };

  exports.Draggable = Draggable;

}(this);
