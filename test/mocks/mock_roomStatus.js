!function(exports) {
  'use strict';

  var realRoomStatus = null;

  var MockRoomStatus = {
    _install: function() {
      realRoomStatus = exports.RoomStatus;
      exports.RoomStatus = MockRoomStatus;
    },
    _restore: function() {
      exports.RoomStatus = realRoomStatus;
    },
    set: function() {},
    get: function() {}
  };

  exports.MockRoomStatus = MockRoomStatus;

}(this);
