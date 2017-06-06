!(function(exports) {
  'use strict';

  var isTouch = 'ontouchstart' in exports;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  var getTouch = (function getTouchWrapper() {
    return isTouch ? function(e) { return e.touches[0]; } :
                     function(e) { return e; };
  }());

  var DragDetector = function(element) {
    this.element = element;
    this.timer = null;
    element.addEventListener(touchstart, this);
  };

  DragDetector.DRAG_TIMEOUT = 200;
  DragDetector.CLICK_THRESHOLD = 10;

  DragDetector.prototype = {
    attachHandlers: function() {
      [touchmove, touchend, 'contextmenu'].forEach(function(eventName) {
        this.element.addEventListener(eventName, this);
      }, this);
    },

    removeHandlers: function() {
      [touchmove, touchend, 'contextmenu'].forEach(function(eventName) {
        this.element.removeEventListener(eventName, this);
      }, this);
    },

    startTimer: function() {
      this.attachHandlers();
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
      Utils.sendEvent('DragDetector:dragstart', {
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

          break;

        case touchmove:
          var touch = getTouch(evt); // eslint-disable-line no-redeclare
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

    this.translatedX = parseInt(element.data('translatedX') || '0', 10);
    this.translatedY = parseInt(element.data('translatedY') || '0', 10);
    this.translate();

    this.detector = new DragDetector(element);
    element.addEventListener('DragDetector:dragstart', this);
  };

  DraggableElement.prototype = {
    attachHandlers: function() {
      [touchmove, touchend].forEach(function(eventName) {
        exports.addEventListener(eventName, this);
      }, this);
    },

    removeHandlers: function() {
      [touchmove, touchend].forEach(function(eventName) {
        exports.removeEventListener(eventName, this);
      }, this);
    },

    handleEvent: function(evt) {
      switch (evt.type) {
        case 'DragDetector:dragstart':
          this.startX = evt.detail.pageX - this.translatedX;
          this.startY = evt.detail.pageY - this.translatedY;
          this.attachHandlers();
          this.element.classList.add('dragging');

          break;

        case touchmove:
          var touch = getTouch(evt);
          this.translatedX = touch.pageX - this.startX;
          this.element.data('translatedX', this.translatedX);
          this.translatedY = touch.pageY - this.startY;
          this.element.data('translatedY', this.translatedY);
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
      this.element.removeEventListener('DragDetector:dragstart', this);
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
    },

    DRAG_TIMEOUT: DragDetector.DRAG_TIMEOUT,

    CLICK_THRESHOLD: DragDetector.CLICK_THRESHOLD
  };

  exports.Draggable = Draggable;
}(this));
