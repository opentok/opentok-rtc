// Don't pollute the global space if we're not on Node...
!(function (global) {
  'use strict';

  var references = {};

  var MockRef = function (namespace, parent) {
    var _events = {
      value: [],
      child_added: []
    };

    var _data = {};

    var trigger = function (evt, value) {
      _events[evt].forEach((e) => {
        e.apply(null, [value]);
      });
    };

    this.parent = parent;

    this.key = Date.now().toString() + Math.round(Math.random() * 10000);

    this.child = function (namespace) {
      if (!references[namespace]) {
        references[namespace] = new MockRef(namespace, this);
      }

      return references[namespace];
    };

    this.on = function (evt, fn) {
      _events[evt].push(fn);
    };

    this.push = function () {
      this.key = Date.now().toString() + Math.round(Math.random() * 10000);
      return this;
    };

    this.set = function (data) {
      var snapshot = {
        val: () => data
      };
      trigger('value', snapshot);
      return this;
    };

    this.onDisconnect = function () {
      return this;
    };

    this.update = function (data, callback) {
      if (typeof callback === 'function') {
        callback.apply(null);
      }
      return this;
    };

    this.remove = function (callback) {
      if (typeof callback === 'function') {
        callback.apply(null);
      }
      return this;
    };

    this.unauth = () => {};
  };

  var MockFirebase = {};

  MockFirebase.credential = {
    cert: () => 'fakeCredential'
  };

  MockFirebase.initializeApp = function () {
    this.auth = function () {
      return {
        createCustomToken: () => Promise.resolve('fakeToken'),
        signInWithCustomToken: (f) => {
          return Promise.resolve();
        }
      };
    };
  };

  MockFirebase.database = function () {
    return {
      ref: (namespace) => {
        namespace = namespace || '/';
        if (!references[namespace]) {
          references[namespace] = new MockRef(namespace, null);
        }
        return references[namespace];
      }
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockFirebase;
  } else {
    global.MockFirebase = MockFirebase;
  }
}(this));
