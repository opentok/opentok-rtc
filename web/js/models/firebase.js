//  globals Firebase

!(exports => {
  const archives = null;
  const listeners = {};

  const archiveHandler = {
    archiveUpdates(evt) {
      const handlers = listeners.value;
      const archiveValues = Promise.resolve(evt.detail || {});
      handlers && handlers.forEach(aHandler => {
        archiveValues.then(aHandler.method.bind(aHandler.context));
      });
    }
  };

  function init() {
    const self = this;
    return new Promise(resolve => {
      Utils.addEventsHandlers('roomController:', archiveHandler, exports);
      resolve(self);
    });
  }

  function addEventListener(type, aHandler) {
    let context;
    if (!(type in listeners)) {
      listeners[type] = [];
    }

    let hd = aHandler;
    if (typeof hd === 'object') {
      context = hd;
      hd = hd.handleEvent;
    }

    if (hd) {
      listeners[type].push({
        method: hd,
        context
      });
    }
  }

  function removeEventListener(type, aHandler) {
    if (!(type in listeners)) {
      return false;
    }
    const handlers = listeners[type];
    if (handlers) {
      for (let i = 0, l = handlers.length; i < l; i++) {
        let thisHandler = aHandler;
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

  const FirebaseModel = {
    addEventListener,
    removeEventListener,
    init,
    get archives() {
      return archives;
    }
  };

  exports.FirebaseModel = FirebaseModel;
})(this);
