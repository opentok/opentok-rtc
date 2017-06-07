/**
 * CHAT COMPONENT
 * They are formed by chatController.js chatView.js, chat.js and textProcessor.js
 * The chat module needs for work OTHelper.js and browser_utils.js
 * If you want to have the previous status and roomStatus at your connection you need
 * roomStatus.js too
 * INCOMING events: outside events that the module will listen for
 * You could change their default name calling init method with the appropiated variable
 * (explained later)
 * - updatedRemotely: This action should be fired to load the history of the chat (previous
 *                    messages to our connection)
 *   Default value: roomStatus:updatedRemotely
 * - chatVisibility: This action should be fired to change the status (visible or hidden)
 *                    of the chat.
 *   Default value: roomView:chatVisibility
 *
 * OUTGOING events: events that will be fired by the module
 * - incomingMessage: A new message has been received
 *   NAME: chatController:incomingMessage
 * - presenceEvent: A new event has been received. A event could be that a new user has
 *                  connected or disconnected.
 *   Name: chatController:presenceEvent
 * - messageDelivered: A message has been sended
 *   Name: chatController:messageDelivered
 * - outgoingMessage: A message has been sended
 *   name: chatView:outgoingMessage
 * - hidden: it will be fired when the chat has been hidden
 *   name: chat:hidden
 * - unreadMessage: There was received a message while the chat was hidden
 *   name: chatView:unreadMessage
 *
 *
 *                                            -----------------
 *        roomStatus:updatedRemotely         |                 |
 *  ---------------------------------------->|                 |
 *        chatController:MessageDelivered    |                 |
 *  <-------------------------------------*--|                 |
 *        chatController:incomingMessage  |  | ChatController  |
 *  <-----------------------------------*-)--|                 |
 *        chatController:presenceEvent  | |  |                 |
 *  <---------------------------------*-)-)--|                 |
 *                                  --)-)-)->|                 |
 *                                  | | | |  |                 |
 *                                  | | | |   -----------------
 *                                  | | | |
 *                                  | | | |   -----------------
 *                                  | | | -->|                 |
 *                                  | | ---->|                 |
 *                                  | ------>|                 |
 *        chatView:outgoingMessage  |        |                 |
 *  <-------------------------------*--------|    ChatView     |
 *        chatView:unreadMessage             |                 |
 *  <----------------------------------------|                 |
 *        roomView:chatVisibility            |                 |
 *  ---------------------------------------->|                 |
 *                                            -----------------
 *
 *        chat:hidden                         -----------------
 *  <----------------------------------------|      Chat       |
 *                                            -----------------
 *
 */

!(function(exports) {
  'use strict';

  var _hasStatus;

  var debug =
    new Utils.MultiLevelLogger('chatController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  // Contains an object foreach action.
  // This enables to configure the name of the received event.
  // The object key is the type of event which is waiting for
  // Each action has:
  //  - name: (mandatory) event name which is going to be listen for
  //  - handler: (mandatory) function which is going to be executed as respond of the event
  //  - target: (optional) who is listening for the event. It'll be global if it is not specified.
  //  - couldBeChanged: we only allow to modify the event's name of the event that come from the
  //                    outside (e.g.: roomView:chatVisibility and roomStatus:updatedRemotely).
  //                    We don't allow to change the event's name originating inside the chat module
  //                    whether it'll be listened for in other module's component
  //                    (e.g. chatView:outgoingMessage)
  var eventsIn;

  var _historyChat;

  var CONN_TEXT = '(has connected)';
  var DISCONN_TEXT = '(left the room)';
  var STATUS_KEY = 'chat';

  function loadHistoryChat() {
    if (!_hasStatus) {
      return;
    }
    var data = RoomStatus.get(STATUS_KEY);
    if (data) {
      _historyChat = data;
      for (var i = 0, l = _historyChat.length; i < l; i++) {
        Utils.sendEvent('chatController:incomingMessage', { data: _historyChat[i] });
      }
    } else {
      _historyChat = [];
      RoomStatus.set(STATUS_KEY, _historyChat);
    }
  }

  var otHelper;

  var _chatHandlers = {
    'signal:chat': function(evt) {
      // A signal of the specified type was received from the session. The
      // SignalEvent class defines this event object. It includes the following
      // properties:
      // data — (String) The data string sent with the signal.
      // from — (Connection) The Connection corresponding to the client that
      //        sent with the signal.
      // type — (String) The type assigned to the signal (if there is one).
      var data = JSON.parse(evt.data);
      _historyChat.push(data);
      Utils.sendEvent('chatController:incomingMessage', { data: data });
    },
    connectionCreated: function(evt) {
      // Dispatched when an new client (including your own) has connected to the
      // session, and for every client in the session when you first connect
      // Session object also dispatches a sessionConnected evt when your local
      // client connects
      var newUsrName = JSON.parse(evt.connection.data).userName;
      if (!this.isMyself(evt.connection)) {
        Utils.sendEvent('chatController:presenceEvent', {
          userName: newUsrName,
          text: CONN_TEXT
        });
      } else {
        otHelper = this;
      }
    },
    connectionDestroyed: function(evt) {
      Utils.sendEvent('chatController:presenceEvent', {
        userName: JSON.parse(evt.connection.data).userName,
        text: DISCONN_TEXT
      });
    }
  };

 /**
  * Send the event received as a message
  */
  function sendMsg(evt) {
    var data = evt.detail;
    return otHelper.sendSignal('chat', data)
      .then(function() {
        Utils.sendEvent('chatController:messageDelivered');
      }).catch(function(error) {
        debug.error('Error sending [', data.text.value, '] to the group. ', error.message);
      });
  }

 /**
  * It receives an array of objects or an object with the handlers to be set on OT.session
  */
  function addOTHandlers(aAllHandlers) {
    if (!Array.isArray(aAllHandlers)) {
      aAllHandlers = [aAllHandlers];
    }
    aAllHandlers.push(_chatHandlers);
    return aAllHandlers;
  }

  /**
   * Set the listener for the application custom events. If receives an array
   * with the new name for the event and it exists here change its name
   */
  function addEventsHandlers(aEvents) {
    Array.isArray(aEvents) && aEvents.forEach(function(aEvt) {
      var event = eventsIn[aEvt.type];
      event && event.couldBeChanged && (event.name = aEvt.name);
    });
    Utils.addHandlers(eventsIn);
  }

  function init(aRoomName, aUsrId, aGlobalHandlers, listenedEvts) {
    return LazyLoader.dependencyLoad([
      '/js/chatView.js'
    ]).then(function() {
      eventsIn = {
        updatedRemotely: {
          name: 'roomStatus:updatedRemotely',
          handler: loadHistoryChat,
          couldBeChanged: true
        },
        outgoingMessage: {
          name: 'chatView:outgoingMessage',
          handler: sendMsg
        }
      };
      _historyChat = [];
      _hasStatus = (exports.RoomStatus !== undefined);
      return ChatView.init(aUsrId, aRoomName, listenedEvts)
        .then(function() {
          _hasStatus && RoomStatus.set(STATUS_KEY, _historyChat);
          addEventsHandlers(listenedEvts);
          return addOTHandlers(aGlobalHandlers);
        });
    });
  }

  exports.ChatController = {
    init: init
  };
}(this));
