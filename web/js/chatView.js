!function(exports) {
  'use strict';

  var UNKNOWN = 'Unknown';
  var _usrId;
  var _roomName;
  var _isVisible;

  var chatWndElem = document.getElementById('chat');
  //var closeChatBtn = chatWndElem.querySelector('
  var closeChatBtn = chatWndElem.querySelector('#closeChat');
  var sendMsgBtn = chatWndElem.querySelector('#sendTxt');
  var chatMsgInput = chatWndElem.querySelector('#msgText');
  var chatNameElem = chatWndElem.querySelector('#chatName');
  var chatContentDiv = chatWndElem.querySelector('#chatMsgs');
  var chatForm = chatWndElem.querySelector('#chatForm');

  var debug = Utils.debug;

  // The ChatController should have the handlers and call the view for
  // doing visual work
  function addHandlers() {

    function submitenter(myfield, evt) {
      var keycode;
      if (window.vent) {
        keycode = window.event.keyCode;
      } else if (evt) {
        keycode = evt.which;
      } else {
        return true;
      }
      if (keycode === 13) {
        onClickSend(evt);
        return false;
      } else {
        return true;
      }
    }

    var onClickSend = function(evt) {
      evt.preventDefault();
      if (chatMsgInput.value === '') {
        return;
      }

      ChatController.sendMsg({
        sender: _usrId,
        time: Utils.getCurrentTime(),
        text: chatMsgInput.value
      }).then(function() {
        chatMsgInput.value = '';
      }).catch(function(error) {
        //TODO Perphas some visual element, I don't sure
        debug.error('Error sending [' + chatMsgInput.value +
                    '] to the group. ' + error.message);
      });
    };

    chatForm.addEventListener('keypress',
                              submitenter.bind(undefined, chatMsgInput));

    chatForm.addEventListener('submit', function(evt) {
      evt.preventDefault();
      return false;
    });

    closeChatBtn.addEventListener('click', function(evt) {
      evt.preventDefault();
      ChatView.visible = false;
    });

    sendMsgBtn.addEventListener('click', onClickSend);
  }

  function insertChatLine(data) {
    HTMLElems.createElementAt(chatContentDiv, 'p', null,
                              'Guest:' + data.sender + ':' + data.time, false);
    HTMLElems.createElementAt(chatContentDiv, 'p', null, data.text, false);
  }

  function setRoomName(name) {
    _roomName = name;
    HTMLElems.addText(chatNameElem, name);
  }

  function init(aUsrId, aRoomName) {
    ChatView.visible = false;
    _usrId = aUsrId;
    setRoomName(aRoomName);

    addHandlers();
  }

  var ChatView = {
    init: init,
    set visible(value) {
      _isVisible = value;
      if (value) {
        chatWndElem.classList.remove('chat-hidden');
        chatWndElem.classList.add('chat-show');
      } else {
        chatWndElem.classList.remove('chat-show');
        chatWndElem.classList.add('chat-hidden');
      }
    },
    get visible() {
      return _isVisible;
    },
    insertChatLine: insertChatLine
  };

  exports.ChatView = ChatView;

}(this);
