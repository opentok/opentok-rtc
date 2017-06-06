!(function (exports) {
  'use strict';

  var realRoomStatus = null;

  var MockRoomStatus = {
    _install() {
      realRoomStatus = exports.RoomStatus;
      exports.RoomStatus = MockRoomStatus;
    },
    _restore() {
      exports.RoomStatus = realRoomStatus;
    },
    set() {},
    get() {},
  };

  exports.MockRoomStatus = MockRoomStatus;
}(this));
