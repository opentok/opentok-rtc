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

  var DragDetector = function(element) {
    this.element = element;
    this.timer = null;
    element.addEventListener(touchstart, this);
  };

  DragDetector.DRAG_TIMEOUT = 200;
  DragDetector.CLICK_THRESHOLD = 10;

  DragDetector.prototype = {
    attachHandlers: function() {
      this.element.addEventListener(touchmove, this);
      this.element.addEventListener(touchend, this);
      this.element.addEventListener('contextmenu', this);
    },

    removeHandlers: function() {
      this.element.removeEventListener(touchmove, this);
      this.element.removeEventListener(touchend, this);
      this.element.removeEventListener('contextmenu', this);
    },

    startTimer: function() {
      this.clearTimer();
      this.timer = setTimeout(function() {
        this.sendEvent();
      }.bind(this), DragDetector.DRAG_TIMEOUT);
    },

    clearTimer: function() {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.removeHandlers();
        this.timer = null;
      }
    },

    sendEvent: function() {
      Utils.sendEvent('dragstart', {
        pageX: this.startX,
        pageY: this.startY
      }, this.element);
      this.clearTimer();
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case touchstart:
          var touch = getTouch(evt);
          this.startX = touch.pageX;
          this.startY = touch.pageY;
          this.startTimer();
          this.attachHandlers();

          break;

        case touchmove:
          var touch = getTouch(evt);
          if (Math.abs(touch.pageX - this.startX) > DragDetector.CLICK_THRESHOLD ||
              Math.abs(touch.pageY - this.startY) > DragDetector.CLICK_THRESHOLD) {
            this.sendEvent();
          }

          break;

        case touchend:
        case 'contextmenu':
          this.clearTimer();

          break;
      }
    },

    destroy: function() {
      this.clearTimer();
      this.element.removeEventListener(touchstart, this);
      this.element = null;
      this.startX = null;
      this.startY = null;
    }
  };

  var DraggableElement = function(element) {
    this.element = element;
    this.elementStyle = element.style;

    this.translatedX = parseInt(element.dataset.translatedX || '0', 10);
    this.translatedY = parseInt(element.dataset.translatedY || '0', 10);
    this.translate();

    this.detector = new DragDetector(element);
    element.addEventListener('dragstart', this);
  };

  DraggableElement.prototype = {
    attachHandlers: function() {
      exports.addEventListener(touchmove, this);
      exports.addEventListener(touchend, this);
    },

    removeHandlers: function() {
      exports.removeEventListener(touchmove, this);
      exports.removeEventListener(touchend, this);
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'dragstart':
          this.startX = evt.detail.pageX - this.translatedX;
          this.startY = evt.detail.pageY - this.translatedY;
          this.attachHandlers();
          this.element.classList.add('dragging');

          break;

        case touchmove:
          var touch = getTouch(evt);
          this.element.dataset.translatedX = this.translatedX = touch.pageX - this.startX;
          this.element.dataset.translatedY = this.translatedY = touch.pageY - this.startY;
          this.translate();

          break;

        case touchend:
          this.removeHandlers();
          this.element.classList.remove('dragging');

          break;
      }
    },

    translate: function() {
      Utils.setTransform(this.elementStyle,
                         'translate('.concat(this.translatedX, 'px,', this.translatedY, 'px)'));
    },

    destroy: function() {
      this.element.removeEventListener('dragstart', this);
      this.detector.destroy();
      Utils.setTransform(this.elementStyle, '');
      this.removeHandlers();
      this.element.classList.remove('dragging');
      this.element = null;
      this.elementStyle = null;
    }
  };

  var elements = {};

  var Draggable = {
    on: function(element) {
      element && !elements[element] && (elements[element] = new DraggableElement(element));
    },

    off: function(element) {
      var draggableElement = elements[element];
      if (draggableElement) {
        draggableElement.destroy();
        elements[element] = null;
      }
    }
  };

  exports.Draggable = Draggable;

}(this);
