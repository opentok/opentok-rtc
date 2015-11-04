!function(exports) {
  'use strict';

  var TIME_RESEND_CHAT = 60000;

  var _connectedEarlierThanMe = 0;
  var _connectedAfterMe = {};
  var _historyChat = [];

  var _usrId;
  var _creationTime;
  var _myCreationTime;

  var CONN_SUFIX = ' has connected';
  var DISCONN_SUFIX = ' has disconnected';

  function loadChat(data) {
    if (data) {
      for (var i = 0, l = data.length; i < l; i++) {
        _historyChat.push(data[i]);
        ChatView.insertChatLine(data[i]);
      }
    }
  }

  function sendHistoryAck() {
    OTHelper.sendSignal({
      type: 'chatHistoryACK',
      data: _usrId
    });
  }

  function sendChat(aUser) {
    return OTHelper.sendSignal({
      type: 'chatHistory',
      to: aUser,
      data: JSON.stringify(_historyChat)
    });
  }

  function IMustSend() {
    return _connectedEarlierThanMe <= 0;
  }

  function cancelPendingSendHistory(aConnectionId) {
    var conn = _connectedAfterMe[aConnectionId];
    if (conn !== undefined) {
      delete _connectedAfterMe[aConnectionId];
      window.clearInterval(conn);
    }
  }

  function proccessNewConnection(evt) {
    var newUsrConnection = evt.connection;
    var newUsr = JSON.parse(newUsrConnection.data).userName;
    var creationTime = newUsrConnection.creationTime;
    var connectionId = newUsrConnection.connectionId;

    if (creationTime < _myCreationTime) {
      _connectedEarlierThanMe++;
    } else if (newUsr !== _usrId) {
      var send = function(aNewUsrConnection) {
        if (IMustSend()) {
          sendChat(aNewUsrConnection);
        }
      };

      send(newUsrConnection);

      var intervalResendChat =
        window.setInterval(send.bind(undefined, newUsrConnection),
                           TIME_RESEND_CHAT);
      _connectedAfterMe[connectionId] = intervalResendChat;
    }
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
    'signal:chatHistory': function(evt) {
      loadChat(JSON.parse(evt.data));
      sendHistoryAck();
      // FOLLOW-UP This event must have been an once event and don't need
      // to remove it
      OTHelper.removeListener('signal:chatHistory');
    },
    'signal:chatHistoryACK': function(evt) {
      cancelPendingSendHistory(evt.from.connectionId);
    },
    'connectionCreated': function(evt) {
      // Dispatched when an new client (including your own) has connected to the
      // session, and for every client in the session when you first connect
      // Session object also dispatches a sessionConnected evt when your local
      // client connects
        evt.connection.data && proccessNewConnection(evt);
        var newUsrName = JSON.parse(evt.connection.data).userName;
        if (newUsrName !== _usrId) {
          ChatView.insertChatEvent( newUsrName + CONN_SUFIX);
        }
    },
    'sessionConnected': function(evt) {
      _myCreationTime = evt.target.connection.creationTime;
    },
    'connectionDestroyed': function(evt) {
      // If connection destroyed belongs to someone older than me,
      // remove one element from connected early than me array
      // no matters who, it only care the length of this array,
      // when it's zero it's my turn to send history chat
      if (evt.connection.creationTime < _myCreationTime) {
        _connectedEarlierThanMe--;
      }
      cancelPendingSendHistory(evt.connection.connectionId);
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
        return addHandlers(aGlobalHandlers);
      });
    });
  }

  exports.ChatController = {
    init: init,
    sendMsg: sendMsg
  };

}(this);
