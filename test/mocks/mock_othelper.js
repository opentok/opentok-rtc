!function(exports) {
  'use strict';

  var realOTHelper = null;

  var MockOTHelper = {
    error: {
      code: 1,
      message: 'Not sharing'
    },
    _myConnId: 'myConnectionId',
    isGoingToWork: true,
    _install: function() {
      realOTHelper = exports.OTHelper;
      exports.OTHelper = MockOTHelper;
    },
    _restore: function() {
      exports.OTHelper = realOTHelper;
    },
    isMyself: function(connection) {
      return this._myConnId === connection.connectionId;
    },
    registerScreenShareExtension: function() {},
    shareScreen: function() {
      if (this.isGoingToWork) {
        return Promise.resolve();
      } else {
        return Promise.reject(this.error);
      }
    },
    stopShareScreen: function() {},
    screenShareErrorCodes: {
      accessDenied: 1500,
      extNotInstalled: 'OT0001',
      extNotRegistered: 'OT0002',
      notSupported: 'OT0003',
      errPublishingScreen: 'OT0004'
    },
    sendSignal: function() {
      return Promise.resolve();
    },
    removeListener: function(evtName) {},
    disconnectFromSession: function() {}
  };

  exports.MockOTHelper = MockOTHelper;

}(this);
