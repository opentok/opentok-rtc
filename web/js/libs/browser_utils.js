!function(exports) {

  'use strict';

  var getCurrentTime = function() {
    var now = new Date();
    var min = now.getMinutes().toString();
    var hours = now.getHours().toString();
    var ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return hours + ':' + min + ' ' + ampm;
  };

  var inspectObject = function(obj){
    var str = '';
    Object.keys(obj).forEach(function(elto) {
      str += '\n' + elto + ':' + JSON.stringify(obj[elto]);
    });
    return str;
  };

  var sendEvent = function(eventName, data, target) {
    data = data ? { detail: data } : {};
    var newEvt = new CustomEvent(eventName, data);
    (target || exports).dispatchEvent(newEvt);
  };

  var addEventsHandlers = function(eventPreffixName, handlers, target) {
    Object.keys(handlers).forEach(function(eventName) {
      (target || exports).addEventListener(eventPreffixName + eventName, handlers[eventName]);
    });
  };

  var setTransform = function(style, transform) {
    style.MozTransform = style.webkitTransform = style.msTransform = style.transform = transform;
  };

  var Utils = {
    getCurrentTime: getCurrentTime,
    inspectObject: inspectObject,
    sendEvent: sendEvent,
    addEventsHandlers: addEventsHandlers,
    get draggableUI() {
      return document.querySelectorAll('[draggable]').length;
    },
    getDraggable() {
      return LazyLoader.dependencyLoad([
        '/js/components/draggable.js'
      ]).then(function() {
        return Draggable;
      });
    },
    isScreen: function(item) {
      var type = item.dataset.streamType;
      return type === 'desktop' || type === 'screen';
    },
    setTransform: setTransform
  };

  // Just replacing global.utils might not be safe... let's just expand it...
  exports.Utils = exports.Utils || {};
  Object.keys(Utils).forEach(function (utilComponent) {
    exports.Utils[utilComponent] = Utils[utilComponent];
  });

}(this);
