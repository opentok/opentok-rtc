!function(exports) {
  'use strict';

  var debug = Utils.debug;

  var TIME_RESEND_CHAT = 60000;

  var _connectedUsers = [];
  var _usrId;
  var _historyChat = [];

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
      ChatView.insertChatLine(data);
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
      ChatView.init(aRoomName, aUsrId);
      _usrId = aUsrId;
      return addHandlers(aGlobalHandlers);
    });
  }

  exports.ChatController = {
    init: init,
    sendMsg: sendMsg
  };

}(this);
