!function(exports) {
  'use strict';

  var model = null;

  function init(firebaseUrl, firebaseToken) {
    return LazyLoader.dependencyLoad([
      '/js/models/firebase.js',
      '/js/recordingsView.js'
    ]).then(function() {
      FirebaseModel.
        init(firebaseUrl, firebaseToken).
        then(function(aModel) {
          model = aModel;
          Utils.sendEvent('recordings-model-ready', null, exports);
          RecordingsView.init(model);
        });
    });
  }

  exports.RecordingsController = {
    init: init,
    get model() {
      return model;
    }
  };

}(this);
