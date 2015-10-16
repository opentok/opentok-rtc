
var _MockFirebase = require('mockfirebase').MockFirebase;

function MockFirebase(aURL) {
  var _mock = MockFirebase.references[aURL];
  if (!_mock) {
    _mock = new _MockFirebase(aURL);
    _mock._authWithCustomTokenOrig = _mock.authWithCustomToken;
    _mock.authWithCustomToken = function(aToken, aCallback) {
      _mock._authWithCustomTokenOrig(aToken, aCallback);
      // We're not even using this... :/
      _mock.changeAuthState({
        uid: 'theUid',
        provider: 'github',
        token: 'theToken',
        expires: Math.floor(new Date() / 1000) + 24 * 60 * 60, // expire in 24 hours
        auth: {
        myAuthProperty: true
        }
      });
    };
    _mock = _mock.autoFlush(true);
    MockFirebase.references[aURL] = _mock;
  };
  return _mock;
};

// This will come handy for tests...
MockFirebase.references = {};

module.exports = MockFirebase;


