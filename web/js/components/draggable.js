!((exports) => {
  const isTouch = 'ontouchstart' in exports;
  const touchstart = isTouch ? 'touchstart' : 'mousedown';
  const touchmove = isTouch ? 'touchmove' : 'mousemove';
  const touchend = isTouch ? 'touchend' : 'mouseup';

  const getTouch = (function getTouchWrapper() {
    return isTouch ? (e) => e.touches[0]
      : (e) => e;
  }());

  const DragDetector = function (element) {
    this.element = element;
    this.timer = null;
    element.addEventListener(touchstart, this);
  };

  DragDetector.DRAG_TIMEOUT = 200;
  DragDetector.CLICK_THRESHOLD = 10;

  DragDetector.prototype = {
    attachHandlers() {
      [touchmove, touchend, 'contextmenu'].forEach(function (eventName) {
        this.element.addEventListener(eventName, this);
      }, this);
    },

    removeHandlers() {
      [touchmove, touchend, 'contextmenu'].forEach(function (eventName) {
        this.element.removeEventListener(eventName, this);
      }, this);
    },

    startTimer() {
      this.attachHandlers();
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.sendEvent();
      }, DragDetector.DRAG_TIMEOUT);
    },

    clearTimer() {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.removeHandlers();
        this.timer = null;
      }
    },

    sendEvent() {
      Utils.sendEvent('DragDetector:dragstart', {
        pageX: this.startX,
        pageY: this.startY,
      }, this.element);
      this.clearTimer();
    },

    handleEvent(evt) {
      switch (evt.type) {
        case touchstart:
          var touch = getTouch(evt);
          this.startX = touch.pageX;
          this.startY = touch.pageY;
          this.startTimer();

          break;

        case touchmove:
          var touch = getTouch(evt); // eslint-disable-line no-redeclare
          if (Math.abs(touch.pageX - this.startX) > DragDetector.CLICK_THRESHOLD
              || Math.abs(touch.pageY - this.startY) > DragDetector.CLICK_THRESHOLD) {
            this.sendEvent();
          }

          break;

        case touchend:
        case 'contextmenu':
          this.clearTimer();

          break;
      }
    },

    destroy() {
      this.clearTimer();
      this.element.removeEventListener(touchstart, this);
      this.element = null;
      this.startX = null;
      this.startY = null;
    },
  };

  const DraggableElement = function (element) {
    this.element = element;
    this.elementStyle = element.style;

    this.translatedX = parseInt(element.data('translatedX') || '0', 10);
    this.translatedY = parseInt(element.data('translatedY') || '0', 10);
    this.translate();

    this.detector = new DragDetector(element);
    element.addEventListener('DragDetector:dragstart', this);
  };

  DraggableElement.prototype = {
    attachHandlers() {
      [touchmove, touchend].forEach(function (eventName) {
        exports.addEventListener(eventName, this);
      }, this);
    },

    removeHandlers() {
      [touchmove, touchend].forEach(function (eventName) {
        exports.removeEventListener(eventName, this);
      }, this);
    },

    handleEvent(evt) {
      switch (evt.type) {
        case 'DragDetector:dragstart': {
          this.startX = evt.detail.pageX - this.translatedX;
          this.startY = evt.detail.pageY - this.translatedY;
          this.attachHandlers();
          this.element.classList.add('dragging');
          break;
        }
        case touchmove: {
          const touch = getTouch(evt);
          this.translatedX = touch.pageX - this.startX;
          this.element.data('translatedX', this.translatedX);
          this.translatedY = touch.pageY - this.startY;
          this.element.data('translatedY', this.translatedY);
          this.translate();
          break;
        }
        case touchend:
        {
          this.removeHandlers();
          this.element.classList.remove('dragging');
          break;
        }
        default: {
          console.warn('draggable: Unknown Event recieved');
        }
      }
    },

    translate() {
      Utils.setTransform(this.elementStyle,
        'translate('.concat(this.translatedX, 'px,', this.translatedY, 'px)'));
    },

    destroy() {
      this.element.removeEventListener('DragDetector:dragstart', this);
      this.detector.destroy();
      Utils.setTransform(this.elementStyle, '');
      this.removeHandlers();
      this.element.classList.remove('dragging');
      this.element = null;
      this.elementStyle = null;
    },
  };

  const elements = {};

  const Draggable = {
    on(element) {
      element && !elements[element] && (elements[element] = new DraggableElement(element));
    },

    off(element) {
      const draggableElement = elements[element];
      if (draggableElement) {
        draggableElement.destroy();
        elements[element] = null;
      }
    },

    DRAG_TIMEOUT: DragDetector.DRAG_TIMEOUT,

    CLICK_THRESHOLD: DragDetector.CLICK_THRESHOLD,
  };

  exports.Draggable = Draggable;
})(this);
