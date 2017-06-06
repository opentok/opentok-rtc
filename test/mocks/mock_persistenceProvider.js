'use strict';

// We don't need to mock all the functionality. Just what we're actually using...

// The mock state is shared between all the instances!
var _internalState;

module.exports = function () {
  function Pipeline() {
    var requestedKeys = [];

    this.get = function (aKey) {
      requestedKeys.push(aKey);
      return this;
    };

    this.exec = function () {
      return Promise.resolve(requestedKeys.map(key => [null, _internalState[key]]));
    };
  }

  return {
    on(aSignal, aCB) {
      if (aSignal === 'ready') {
        setTimeout(aCB);
      }
    },
    pipeline() {
      return new Pipeline();
    },
    get(aKey) {
      return Promise.resolve(_internalState[aKey]);
    },
    set(aKey, aValue) {
      _internalState[aKey] = aValue;
      return Promise.resolve(aValue);
    },
    setex(aKey, aTimeout, aValue) {
      _internalState[aKey] = aValue;
      setTimeout(() => {
        // Not entirely correct! The timeout should be overriden
        delete _internalState[aKey];
      }, aTimeout * 1000);
      return Promise.resolve(aValue);
    },
    del(aKey) {
      delete _internalState[aKey];
      return Promise.resolve(1);
    },
  };
};

module.exports.setInternalState = function (state) {
  _internalState = state;
};
