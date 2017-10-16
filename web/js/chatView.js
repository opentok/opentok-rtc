/* global Chat, TextProcessor, otHelper */

!(function (exports) {
  'use strict';

  var usrId;

  var closeChatBtn;
  var headerChat;
  var sendMsgBtn;
  var chatMsgInput;
  var chatContainer;
  var chatContent;
  var chatForm;
  var chatParticipants = [];

  var _visibilityChanging = Promise.resolve();

  function isVisible() {
    return _visibilityChanging.then(function () {
      return Chat.visible;
    });
  }

  function setVisibility(isVisible) {
    if (isVisible) {
      addHandlers();
      return Chat.show().then(function () {
        scrollTo();
        chatMsgInput.focus();
      });
    }
    removeHandlers();
    return Chat.hide();
  }

  var eventHandlers;

  function addEventsHandlers(configuredEvts) {
    eventHandlers = {
      incomingMessage: {
        name: 'chatController:incomingMessage',
        handler: function (evt) {
          var data = evt.detail.data;
          insertChatLine(data);
          isVisible().then(function (visible) {
            if (!visible) {
              Utils.sendEvent('chatView:unreadMessage', { data: data });
            }
          });
        }
      },
      presenceEvent: {
        name: 'chatController:presenceEvent',
        handler: function (evt) {
          insertChatEvent(evt.detail);
        }
      },
      messageDelivered: {
        name: 'chatController:messageDelivered',
        handler: function () {
          chatMsgInput.value = '';
        }
      },
      chatVisibility: {
        name: 'roomView:chatVisibility',
        handler: function (evt) {
          _visibilityChanging = setVisibility(evt.detail);
        },
        couldBeChanged: true
      }
    };
    Array.isArray(configuredEvts) && configuredEvts.forEach(function (aEvt) {
      var event = eventHandlers[aEvt.type];
      event && event.couldBeChanged && (event.name = aEvt.name);
    });
    Utils.addHandlers(eventHandlers);
  }

  function initHTMLElements() {
    var chatWndElem = document.getElementById('chat');
    headerChat = chatWndElem.querySelector('header');
    closeChatBtn = chatWndElem.querySelector('#closeChat');
    sendMsgBtn = chatWndElem.querySelector('#sendTxt');
    chatMsgInput = chatWndElem.querySelector('#msgText');
    chatContainer = chatWndElem.querySelector('#chatMsgs');
    chatContent = chatContainer.querySelector('ul');
    chatForm = chatWndElem.querySelector('#chatForm');
  }

  var onSendClicked = function (evt) {
    evt.preventDefault();
    if (!chatMsgInput.value.trim().length) {
      return;
    }
    Utils.sendEvent('chatView:outgoingMessage', {
      sender: usrId,
      time: Utils.getCurrentTime(),
      text: chatMsgInput.value.trim()
    });
  };

  var onKeyPress = function (myfield, evt) {
    var keycode;
    if (window.vent) {
      keycode = window.event.keyCode;
    } else if (evt) {
      keycode = evt.which;
    } else {
      return true;
    }
    if (keycode === 13) {
      if (evt.shiftKey === true) {
        return true;
      }
      onSendClicked(evt);
      return false;
    }
    return true;
  }.bind(undefined, chatMsgInput);

  var onSubmit = function (evt) {
    evt.preventDefault();
    return false;
  };

  var onClose = function (evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    _visibilityChanging = setVisibility(false);
    Utils.sendEvent('chatView:hidden');
  };

  var onToggle = function () {
    Chat.isCollapsed() ? Chat.expand() : Chat.collapse();
  };

  var onDrop = function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  };

  // The ChatController should have the handlers and call the view for
  // doing visual work
  function addHandlers() {
    chatForm.addEventListener('keypress', onKeyPress);
    chatForm.addEventListener('submit', onSubmit);
    chatForm.addEventListener('drop', onDrop);
    closeChatBtn.addEventListener('click', onClose);
    headerChat.addEventListener('click', onToggle);
    sendMsgBtn.addEventListener('click', onSendClicked);
  }

  function removeHandlers() {
    chatForm.removeEventListener('keypress', onKeyPress);
    closeChatBtn.removeEventListener('click', onClose);
    headerChat.removeEventListener('click', onToggle);
    sendMsgBtn.removeEventListener('click', onSendClicked);
    chatForm.removeEventListener('drop', onDrop);
  }

  function insertChatEvent(data) {
    var time = (data.time || Utils.getCurrentTime()).toLowerCase();
    var item = HTMLElems.createElementAt(chatContent, 'li');
    item.classList.add('event');
    var name = data.sender || data.userName;
    var text = time + ' - ' + name + ' ' + data.text;
    insertText(item, text);
    scrollTo();
  }

  function insertText(elemRoot, text) {
    var txtElems = TextProcessor.parse(text);
    var targetElem = HTMLElems.createElementAt(elemRoot, 'p');
    txtElems.forEach(function (node) {
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
    if (otHelper.isMyself({ connectionId: data.senderId })) {
      item.classList.add('yourself');
    } else {
      var chatIndex = chatParticipants.indexOf(data.senderId);
      if (chatIndex === -1) {
        chatIndex = chatParticipants.push(data.senderId) - 1;
      }
      // We only have 10 colors so just get last digit.
      var participantNumber = chatIndex.toString().slice(-1);
      info.data('participant-number', participantNumber);
    }

    var time = data.time.toLowerCase();
    HTMLElems.createElementAt(info, 'span', null, time).classList.add('time');
    HTMLElems.createElementAt(info, 'span', null, data.sender || data.userName)
              .classList.add('sender');

    insertText(info, data.text);

    scrollTo();
  }

  function scrollTo() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function init(aUsrId, configuredEvts) {
    return LazyLoader.dependencyLoad([
      '/js/helpers/textProcessor.js',
      '/js/components/chat.js'
    ]).then(function () {
      initHTMLElements();
      usrId = aUsrId;
      Chat.init();
      addEventsHandlers(configuredEvts);
    });
  }

  var ChatView = {
    init: init
  };

  exports.ChatView = ChatView;
}(this));
