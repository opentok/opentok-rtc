!(function (exports) {
  'use strict';

  var archives = null;
  var listeners = {};

  var archiveHandler = {
    archiveUpdates: function (evt) {
      var handlers = listeners.value;
      var archiveValues = Promise.resolve(evt.detail || {});
      handlers && handlers.forEach(function (aHandler) {
        archiveValues.then(aHandler.method.bind(aHandler.context));
      });
    }
  };

  function init() {
    var self = this;
    return new Promise(function (resolve) {
      Utils.addEventsHandlers('roomController:', archiveHandler, exports);
      resolve(self);
    });
  }

  function addEventListener(type, aHandler) {
    var context;
    if (!(type in listeners)) {
      listeners[type] = [];
    }

    var hd = aHandler;
    if (typeof hd === 'object') {
      context = hd;
      hd = hd.handleEvent;
    }

    if (hd) {
      listeners[type].push({
        method: hd,
        context: context
      });
    }
  }

  function removeEventListener(type, aHandler) {
    if (!(type in listeners)) {
      return false;
    }
    var handlers = listeners[type];
    if (handlers) {
      for (var i = 0, l = handlers.length; i < l; i++) {
        var thisHandler = aHandler;
        if (typeof thisHandler === 'object') {
          thisHandler = aHandler.handleEvent;
        }
        if (handlers[i].method === thisHandler) {
          handlers.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }

  var ArchivesEventsListener = {
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    init: init,
    get archives() {
      return archives;
    }
  };

  exports.ArchivesEventsListener = ArchivesEventsListener;
}(this));
