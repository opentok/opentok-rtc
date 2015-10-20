!function(exports) {
  'use strict';

  function init(firebaseUrl, firebaseToken) {
    return LazyLoader.dependencyLoad([
      '/js/models/firebase.js',
      '/js/recordingsView.js'
    ]).then(function() {
      FirebaseModel.
        init(firebaseUrl, firebaseToken).
        then(RecordingsView.init);
    });
  }

  exports.RecordingsController = {
    init: init
  };

}(this);
