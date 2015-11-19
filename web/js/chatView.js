!function(exports) {
  'use strict';

  var usrId;

  var closeChatBtn,
      toggleChatBtn,
      sendMsgBtn,
      chatMsgInput,
      chatContainer,
      chatContent,
      chatForm;

  var debug =
    new Utils.MultiLevelLogger('chatView.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);


  function initHTMLElements() {
    var chatWndElem = document.getElementById('chat');
    closeChatBtn = chatWndElem.querySelector('#closeChat');
    toggleChatBtn = chatWndElem.querySelector('#toggleChat');
    sendMsgBtn = chatWndElem.querySelector('#sendTxt');
    chatMsgInput = chatWndElem.querySelector('#msgText');
    chatContainer = chatWndElem.querySelector('#chatMsgs');
    chatContent = chatContainer.querySelector('ul');
    chatForm = chatWndElem.querySelector('#chatForm');
  }

  var onKeyPress = function(myfield, evt) {
    var keycode;
    if (window.vent) {
      keycode = window.event.keyCode;
    } else if (evt) {
      keycode = evt.which;
    } else {
      return true;
    }
    if (keycode === 13) {
      onSendClicked(evt);
      return false;
    } else {
      return true;
    }
  }.bind(undefined, chatMsgInput);

  var onSendClicked = function(evt) {
    evt.preventDefault();
    if (chatMsgInput.value === '') {
      return;
    }

    ChatController.sendMsg({
      sender: usrId,
      time: Utils.getCurrentTime(),
      text: chatMsgInput.value.trim()
    }).then(function() {
      chatMsgInput.value = '';
    }).catch(function(error) {
      debug.error('Error sending [' + chatMsgInput.value + '] to the group. ' +
                   error.message);
    });
  };

  var onSubmit = function(evt) {
    evt.preventDefault();
    return false;
  };

  var onClose = function(evt) {
    evt.preventDefault();
    ChatView.visible = false;
  };

  var onToggle = function(evt) {
    Chat.isCollapsed() ? Chat.expand() : Chat.collapse();
  };

  // The ChatController should have the handlers and call the view for
  // doing visual work
  function addHandlers() {
    chatForm.addEventListener('keypress', onKeyPress);
    chatForm.addEventListener('submit', onSubmit);
    closeChatBtn.addEventListener('click', onClose);
    toggleChatBtn.addEventListener('click', onToggle);
    sendMsgBtn.addEventListener('click', onSendClicked);
  }

  function removeHandlers() {
    chatForm.removeEventListener('keypress', onKeyPress);
    chatForm.removeEventListener('submit', onSubmit);
    closeChatBtn.removeEventListener('click', onClose);
    sendMsgBtn.removeEventListener('click', onSendClicked);
  }

  function insertChatEvent(data) {
    data.time = data.time || Utils.getCurrentTime();
    insertChatLine(data);
  }

  function insertText(elemRoot, text) {
    var txtElems = TextProcessor.parse(text);
    var targetElem = HTMLElems.createElementAt(elemRoot, 'p');
    txtElems.forEach(function(node) {
      switch (node.type) {
        case TextProcessor.TYPE.URL:
          HTMLElems.createElementAt(targetElem, 'a',
            { href: node.value, target: '_blank' }, node.value);
          break;
        default:
          HTMLElems.addText(targetElem, node.value);
      }
    });
  }

  function insertChatLine(data) {
    var item = HTMLElems.createElementAt(chatContent, 'li');

    var info = HTMLElems.createElementAt(item, 'p');

    var time = data.time.toLowerCase();
    HTMLElems.createElementAt(info, 'span', null, time).classList.add('time');
    HTMLElems.createElementAt(info, 'span', null, data.sender || data.userName).
              classList.add('sender');

    insertText(info, data.text);

    scrollTo(item);
  }

  function scrollTo(item) {
    item = item || chatContent.lastChild;
    chatContainer.scrollTop = chatContent.offsetHeight + item.clientHeight;
  }

  function init(aUsrId, aRoomName) {
    return LazyLoader.dependencyLoad([
      '/js/helpers/textProcessor.js',
      '/js/components/chat.js'
    ]).then(function() {
      initHTMLElements();
      usrId = aUsrId;
      Chat.init();
    });
  }

  var ChatView = {
    init: init,

    set visible(value) {
      if (value) {
        Chat.show().then(function() {
          scrollTo();
          addHandlers();
        });
      } else {
        Chat.hide().then(removeHandlers);
      }
    },

    get visible() {
      return Chat.visible;
    },

    insertChatLine: insertChatLine,

    insertChatEvent: insertChatEvent
  };

  exports.ChatView = ChatView;

}(this);
