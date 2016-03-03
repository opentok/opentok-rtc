'use strict';

// We don't need to mock all the functionality. Just what we're actually using...

// The mock state is shared between all the instances!
var _internalState;

module.exports = function() {

  function Pipeline() {
    var requestedKeys = [];

    this.get = function(aKey) {
      requestedKeys.push(aKey);
      return this;
    };

    this.exec = function() {
      return Promise.resolve(requestedKeys.map(key => [null, _internalState[key]]));
    };
  }

  return {
    on: function(aSignal, aCB) {
      if (aSignal === 'ready') {
        setTimeout(aCB);
      }
    },
    pipeline: function() {
      return new Pipeline();
    },
    get: function(aKey) {
      return Promise.resolve(_internalState[aKey]);
    },
    set: function(aKey, aValue) {
      _internalState[aKey] = aValue;
      return Promise.resolve(aValue);
    },
    setex: function(aKey, aTimeout, aValue) {
      _internalState[aKey] = aValue;
      setTimeout(function() {
        // Not entirely correct! The timeout should be overriden
        delete _internalState[aKey];
      }, aTimeout * 1000);
      return Promise.resolve(aValue);
    },
    del: function(aKey) {
      delete _internalState[aKey];
      return Promise.resolve(1);
    }
  };
};

module.exports.setInternalState = function(state) {
  _internalState = state;
};
