!function(exports) {
  'use strict';

  var debug;

  var usrId;
  var roomName;
  var room;

  function init() {
    debug = Utils.debug;

    // pathName should be /whatever/roomName or /whatever/roomName?username=usrId
    debug.log( document.location.pathname);
    debug.log(document.location.search);
    var pathName = document.location.pathname.split('/');

    if (!pathName || pathName.length < 2) {
      debug.log('This should not be happen, it\'s not possible to do a ' +
                'request without /room/<roomName>[?username=<usr>]');
    }

    var roomName = '';
    var length = pathName.length;
    if (length > 0) {
      roomName = pathName[length - 1];
    }

    // Recover user identifier
    var search = document.location.search;
    var usrId = '';
    if (search && search.length > 0) {
      search = search.substring(1);
      usrId = search.split('=')[1];
    }

    //this will change when server api will be defined
    Request.getRoomParams(roomName, usrId).then(function(roomParams) {
      if (!(roomParams && roomParams.token && roomParams.sessionId
            && roomParams.apiKey && roomParams.username)) {
        debug.error('Error getRoomParams [' + roomParams +
                    ' without correct response');
        return;
      }
      room = RoomController.init(roomParams, roomName);
    }).catch(function(evt) {
      debug.error('Error getting room parameters' + evt);
    });
  };

  exports.RTCApp = {
    init: init
  };

}(this);

window.addEventListener('load', function showBody() {
  LazyLoader.dependencyLoad([
    '/js/libs/utils.js',
    '/js/helpers/requests.js',
    '/js/roomController.js'
  ]).then(function() {
    RTCApp.init();
  });
});
