'use strict';

(function(global) {

  var MockMozL10n = {
    get: function(key, values) {
      return key + (values ? JSON.stringify(values) : '');
    },

    readyState: 'complete'
  }

  global.navigator.mozL10n = MockMozL10n;

})(this);
