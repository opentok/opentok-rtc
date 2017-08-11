// Don't pollute the global space if we're not on Node...
!(function (global) {
  'use strict';

  var MockRef = function (parent) {
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

    this.child = function () {
      return new MockRef(this);
    };

    this.on = function (evt, fn) {
      _events[evt].push(fn);
    };

    this.push = function () {
      this.key = Date.now().toString() + Math.round(Math.random() * 10000);
      return this;
    };

    this.set = function () {
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
        createCustomToken: () => Promise.resolve('fakeToken')
      };
    };
  };

  MockFirebase.database = function () {
    return {
      ref: () => new MockRef()
    };
  };

  // function MockCachedFirebase(aURL) {
  //   'use strict';

  //   var mock = MockCachedFirebase.references[aURL];
  //   if (!mock) {
  //     mock = MockFirebase.initializeApp({
  //       credential: MockFirebase.credential.cert(config.credential),
  //       databaseURL: config.dataUrl,
  //       databaseAuthVariableOverride: {
  //         role: 'server',
  //       },
  //     });
  //   }
  //   return mock;
  // }

  // This will come handy for tests...
  // MockCachedFirebase.references = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockFirebase;
  } else {
    // global.MockCachedFirebase = MockCachedFirebase;
    global.MockFirebase = MockFirebase;
  }
}(this));
