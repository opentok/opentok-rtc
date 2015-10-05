!function(exports) {
  'use strict';

  var UNKNOWN = 'Unknown';
  var _usrId;
  var _roomName;

  var chatWndElem,
    // closeChatBtn,
      closeChatBtn,
      sendMsgBtn,
      chatMsgInput,
      chatNameElem,
      chatContainer,
      chatContent,
      chatForm;

  var debug = Utils.debug;


  function initHTMLElements() {
    chatWndElem = document.getElementById('chat');
    //var closeChatBtn = chatWndElem.querySelector('
    closeChatBtn = chatWndElem.querySelector('#closeChat');
    sendMsgBtn = chatWndElem.querySelector('#sendTxt');
    chatMsgInput = chatWndElem.querySelector('#msgText');
    chatNameElem = chatWndElem.querySelector('#chatName');
    chatContainer = chatWndElem.querySelector('#chatMsgs');
    chatContent = chatContainer.querySelector('ul');
    chatForm = chatWndElem.querySelector('#chatForm');
  }

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
    var item = HTMLElems.createElementAt(chatContent, 'li');

    var info = HTMLElems.createElementAt(item, 'p');

    var sender = (data.sender === _usrId ? '' : 'Guest: ') + data.sender;
    HTMLElems.createElementAt(info, 'span', null, sender);
    var time = HTMLElems.createElementAt(info, 'span', null, data.time);
    time.classList.add('time');

    HTMLElems.createElementAt(info, 'p', null, data.text);
    scrollTo(item);
  }

  function scrollTo(item) {
    chatContainer.scrollTop = chatContent.offsetHeight + item.clientHeight;
  }

  function setRoomName(name) {
    _roomName = name;
    HTMLElems.addText(chatNameElem, name);
  }

  function init(aUsrId, aRoomName) {
    initHTMLElements();
    ChatView.visible = false;
    _usrId = aUsrId;
    setRoomName(aRoomName);

    addHandlers();
    Chat.init();
  }

  var ChatView = {
    init: init,

    set visible(value) {
      value ? Chat.show() : Chat.hide();
    },

    get visible() {
      return Chat.visible;
    },

    insertChatLine: insertChatLine
  };

  exports.ChatView = ChatView;

}(this);
