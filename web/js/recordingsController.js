!function(exports) {
  'use strict';

  function init(aRoomName) {
    return LazyLoader.dependencyLoad([
      '/js/models/firebase.js',
      '/js/recordingsView.js'
    ]).then(function() {
      var model = new FirebaseModel(aRoomName);
      return RecordingsView.init(model);
    });
  }

  exports.RecordingsController = {
    init: init
  };

}(this);
