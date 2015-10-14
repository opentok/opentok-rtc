var FirebaseModel = function(aRoomName) {
  this.roomName = aRoomName;
  this.baseURL = 'https://opentok-recordings.firebaseio.com/';
};

FirebaseModel.prototype = {
  init: function() {
    var self = this;

    return LazyLoader.dependencyLoad([
      'https://cdn.firebase.com/js/client/2.3.1/firebase.js'
    ]).then(function() {
      var rootRef = new Firebase(self.baseURL);
      self.videosRef = rootRef.child(self.roomName + '/videos');
    });
  },

  onValue: function(callback) {
    this.videosRef.on('value', function onSuccess(snapshot) {
      var value = snapshot.val();
      value && callback(value);
    }, function onError(errorObject) {
      console.log('Error getting videos from DB', errorObject);
      callback({});
    });
  }
};
