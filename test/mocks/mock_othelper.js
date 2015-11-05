!function(exports) {
  'use strict';

  var realOTHelper = null;

  var MockOTHelper = {
    error: {
      code: 1,
      message: 'Not sharing'
    },
    isGoingToWork: true,
    _install: function() {
      realOTHelper = exports.OTHelper;
      exports.OTHelper = MockOTHelper;
    },
    _restore: function() {
      exports.OTHelper = realOTHelper;
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
    sendSignal: function() {},
    removeListener: function(evtName) {}
  };

  exports.MockOTHelper = MockOTHelper;

}(this);
