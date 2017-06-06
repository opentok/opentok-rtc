!(function(exports) {
  'use strict';

  var TIME_RESEND_STATUS = 60000;

  // Persistent elements of the room
  // Each elements should be key : Object
  // where key is the name of a particular element to preserve
  var _entries = {
  };

  var _myCreationTime;
  var _connectedAfterMe = {};
  var _connectedEarlierThanMe = 0;
  var otHelper;

  function sendStatusAck(aOTHelper) {
    (aOTHelper || otHelper).sendSignal('statusACK');
  }

  function cancelPendingSend(aConnectionId) {
    var conn = _connectedAfterMe[aConnectionId];
    if (conn !== undefined) {
      delete _connectedAfterMe[aConnectionId];
      window.clearInterval(conn);
    }
  }

  function iMustSend() {
    return _connectedEarlierThanMe <= 0;
  }

  function sendStatus(aUser) {
    return otHelper.sendSignal('status', _entries, aUser);
  }

  function proccessNewConnection(evt) {
    var newUsrConnection = evt.connection;
    var creationTime = newUsrConnection.creationTime;
    var connectionId = newUsrConnection.connectionId;

    if (creationTime < _myCreationTime) {
      _connectedEarlierThanMe++;
    } else if (!otHelper.isMyself(newUsrConnection)) {
      var send = function(aNewUsrConnection) {
        if (iMustSend()) {
          sendStatus(aNewUsrConnection);
        }
      };

      send(newUsrConnection);

      var intervalResendStatus =
        window.setInterval(send.bind(undefined, newUsrConnection),
                           TIME_RESEND_STATUS);
      _connectedAfterMe[connectionId] = intervalResendStatus;
    }
  }

  var _statusHandlers = {
    'signal:status': function(evt) {
      _entries = JSON.parse(evt.data);
      sendStatusAck(this);
      // FOLLOW-UP This event must have been an once event and don't need
      // to remove it
      this.removeListener('signal:status');
      Utils.sendEvent('roomStatus:updatedRemotely');
    },
    'signal:statusACK': function(evt) {
      cancelPendingSend(evt.from.connectionId);
    },
    connectionCreated: function(evt) {
      // Dispatched when an new client (including your own) has connected to the
      // session, and for every client in the session when you first connect
      // Session object also dispatches a sessionConnected evt when your local
      // client connects
      evt.connection.data && proccessNewConnection(evt);
    },
    sessionConnected: function(evt) {
      _myCreationTime = evt.target.connection.creationTime;
      otHelper = this;
    },
    connectionDestroyed: function(evt) {
      // If connection destroyed belongs to someone older than me,
      // subtract one from connected early than me
      // no matters who, it only care the number of them,
      // when it's zero it's my turn to send history chat
      if (evt.connection.creationTime < _myCreationTime) {
        _connectedEarlierThanMe--;
      }
      cancelPendingSend(evt.connection.connectionId);
    }
  };

  function addHandlers(aGlobalHandlers) {
    if (!Array.isArray(aGlobalHandlers)) {
      aGlobalHandlers = [aGlobalHandlers];
    }
    aGlobalHandlers.push(_statusHandlers);
    return aGlobalHandlers;
  }

  function init(aGlobalHandlers, aEntries) {
    _entries = aEntries || {};
    return addHandlers(aGlobalHandlers);
  }

  exports.RoomStatus = {
    set: function set(key, value) {
      if (typeof value !== 'object') {
        return;
      }
      _entries[key] = value;
    },
    get: function(key) {
      return _entries[key];
    },
    init: init
  };
}(this));
