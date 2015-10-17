'use strict';

var _MockFirebase = require('mockfirebase').MockFirebase;

function MockFirebase(aURL) {
  var mock = MockFirebase.references[aURL];
  if (!mock) {
    mock = new _MockFirebase(aURL);
    mock._authWithCustomTokenOrig = mock.authWithCustomToken;
    mock.authWithCustomToken = function(aToken, aCallback) {
      mock._authWithCustomTokenOrig(aToken, aCallback);
      // We're not even using this... :/
      mock.changeAuthState({
        uid: 'theUid',
        provider: 'github',
        token: 'theToken',
        expires: Math.floor(new Date() / 1000) + 24 * 60 * 60, // expire in 24 hours
        auth: {
          myAuthProperty: true
        }
      });
    };
    mock = mock.autoFlush(true);
    MockFirebase.references[aURL] = mock;
  };
  return mock;
};

// This will come handy for tests...
MockFirebase.references = {};

module.exports = MockFirebase;
