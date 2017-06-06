// Don't pollute the global space if we're not on Node...
!(function (global) {
  'use strict';

  var hasRequire = typeof require !== 'undefined';
  var MockFirebase = hasRequire ? require('mockfirebase').MockFirebase : global.MockFirebase;

  // This isn't implemented on mockfirebase. We should probably do a PR there,
  // but in the mean time...
  MockFirebase.prototype._cachedDisconnectOps = [];

  MockFirebase.prototype.onDisconnect = function () {
    var pendingOp = {
      remove() {
        this.shouldRemove = true;
      },
    };
    this._cachedDisconnectOps.push(pendingOp);
    return pendingOp;
  };

  MockFirebase.prototype.execOnDisconnects = function () {
    var op;
    while ((op = this._cachedDisconnectOps.shift())) { // eslint-disable-line no-cond-assign
      op.shouldRemove && this.remove();
    }
  };

  function MockCachedFirebase(aURL) {
    'use strict';

    var mock = MockCachedFirebase.references[aURL];
    if (!mock) {
      mock = new MockFirebase(aURL);
      mock._authWithCustomTokenOrig = mock.authWithCustomToken;
      mock.authWithCustomToken = function (aToken, aCallback) {
        mock._authWithCustomTokenOrig(aToken, aCallback);
        // We're not even using this... :/
        /* eslint-disable no-mixed-operators */
        mock.changeAuthState({
          uid: 'theUid',
          provider: 'github',
          token: 'theToken',
          expires: Math.floor(new Date() / 1000) + 24 * 60 * 60, // expire in 24 hours
          auth: {
            myAuthProperty: true,
          },
        });
        /* eslint-enable no-mixed-operators */
      };
      mock = mock.autoFlush(true);
      MockCachedFirebase.references[aURL] = mock;
    }
    return mock;
  }

  // This will come handy for tests...
  MockCachedFirebase.references = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockCachedFirebase;
  } else {
    global.MockCachedFirebase = MockCachedFirebase;
  }
}(this));
