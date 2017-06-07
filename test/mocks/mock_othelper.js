!(function (exports) {
  'use strict';

  var realOTHelper = null;
  var realotHelper = null;

  var _MockOTHelper = {
    bindHandlers(aHandlers) {
      if (Array.isArray(aHandlers)) {
        return aHandlers.map(handler => handler.bind(window.OTHelper));
      }
      return Object.keys(aHandlers)
          .reduce((previous, elem, index, array) => {
            previous[elem] = aHandlers[elem].bind(window.OTHelper);
            return previous;
          }, {});
    },
    error: {
      code: 1,
      message: 'Not sharing',
    },
    _myConnId: 'myConnectionId',
    isGoingToWork: true,
    _install() {
      realOTHelper = exports.OTHelper;
      realotHelper = exports.otHelper;
      exports.OTHelper = MockOTHelper;
      exports.otHelper = _MockOTHelper;
    },
    _restore() {
      exports.OTHelper = realOTHelper;
      exports.otHelper = realotHelper;
    },
    isMyself(connection) {
      return this._myConnId === connection.connectionId;
    },
    registerScreenShareExtension() {},
    shareScreen() {
      if (this.isGoingToWork) {
        return Promise.resolve();
      }
      return Promise.reject(this.error);
    },
    stopShareScreen() {},
    screenShareErrorCodes: {
      accessDenied: 1500,
      extNotInstalled: 'OT0001',
      extNotRegistered: 'OT0002',
      notSupported: 'OT0003',
      errPublishingScreen: 'OT0004',
    },
    sendSignal() {
      return Promise.resolve();
    },
    removeListener(evtName) {},
    disconnectFromSession() {},
  };

  function MockOTHelper() {
    return _MockOTHelper;
  }

  exports.MockOTHelper = MockOTHelper;
  Object.keys(_MockOTHelper).forEach((attr) => {
    exports.MockOTHelper[attr] = _MockOTHelper[attr];
  });
}(this));
