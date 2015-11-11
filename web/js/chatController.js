!function(exports) {
  'use strict';

  var _historyChat = [];

  var _usrId;

  var CONN_SUFIX = ' has connected';
  var DISCONN_SUFIX = ' has disconnected';
  var STATUS_KEY = 'chat';

  function loadHistoricChat() {
    var data = RoomStatus.get(STATUS_KEY);
    if (data) {
      _historyChat = data;
      for (var i = 0, l = _historyChat.length; i < l; i++) {
        ChatView.insertChatLine(_historyChat[i]);
      }
    } else {
      _historyChat = [];
      RoomStatus.set(STATUS_KEY, _historyChat);
    }
  }

  var _roomStatusEvts = {
    'updatedRemotely': loadHistoricChat
  };

  var _chatHandlers = {
    'signal:chat': function(evt) {
      // A signal of the specified type was received from the session. The
      // SignalEvent class defines this event object. It includes the following
      // properties:
      // data — (String) The data string sent with the signal.
      // from — (Connection) The Connection corresponding to the client that
      //        sent with the signal.
      // type — (String) The type assigned to the signal (if there is one).
      // You can register for signals of a specfied type by adding an event
      // handler for the signal:type event (replacing type with the actual type
      // string to filter on). For example, the following code adds an event
      // handler for signals of type "foo":
      // session.on("signal:foo", function(event) {
      //   console.log("foo signal sent from connection " + event.from.id);
      //   console.log("Signal data: " + event.data);
      // });
      // You can register to receive all signals sent in the session, by adding
      // an event handler for the signal event.
      var data = JSON.parse(evt.data);
      _historyChat.push(data);
      ChatView.insertChatLine(data);
    },
    'connectionCreated': function(evt) {
      // Dispatched when an new client (including your own) has connected to the
      // session, and for every client in the session when you first connect
      // Session object also dispatches a sessionConnected evt when your local
      // client connects
        var newUsrName = JSON.parse(evt.connection.data).userName;
        if (newUsrName !== _usrId) {
          ChatView.insertChatEvent( newUsrName + CONN_SUFIX);
        }
    },
    'connectionDestroyed': function(evt) {
      ChatView.insertChatEvent(JSON.parse(evt.connection.data).userName + DISCONN_SUFIX);
    }
  };

  function sendMsg(data) {
    return OTHelper.sendSignal({
      type: 'chat',
      data: JSON.stringify(data)
    });
  }

  function addHandlers(aAllHandlers) {
    if (!Array.isArray(aAllHandlers)) {
      aAllHandlers = [aAllHandlers];
    }
    aAllHandlers.push(_chatHandlers);
    return aAllHandlers;
  }

  function init(aRoomName, aUsrId, aGlobalHandlers) {
    return LazyLoader.dependencyLoad([
      '/js/chatView.js'
    ]).then(function() {
      return ChatView.init(aUsrId, aRoomName).
        then(function() {
          _usrId = aUsrId;
          RoomStatus.set(STATUS_KEY, _historyChat);
          Utils.addEventsHandlers('roomStatus:', _roomStatusEvts);
          return addHandlers(aGlobalHandlers);
        });
    });
  }

  exports.ChatController = {
    init: init,
    sendMsg: sendMsg
  };

}(this);
