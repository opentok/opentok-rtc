/* global Chat, TextProcessor, otHelper */

!(exports => {
  let usrId;

  let closeChatBtn;
  let headerChat;
  let sendMsgBtn;
  let chatMsgInput;
  let chatContainer;
  let chatContent;
  let chatForm;
  let emojiPicker;
  let toggleEmojiBtn;
  const chatParticipants = [];

  let _visibilityChanging = Promise.resolve();

  function isMobile() { return typeof window.orientation !== 'undefined'; }

  function isVisible() {
    return _visibilityChanging.then(() => {
      return Chat.visible;
    });
  }

  function setVisibility(isVisible) {
    if (isVisible) {
      addHandlers();
      return Chat.show().then(() => {
        Utils.sendEvent('chatView:shown');
        scrollTo();
        chatMsgInput.focus();
      });
    }
    removeHandlers();
    return Chat.hide().then(() => {
      Utils.sendEvent('chatView:hidden');
    });
  }

  let eventHandlers;

  function addEventsHandlers(configuredEvts) {
    eventHandlers = {
      incomingMessage: {
        name: 'chatController:incomingMessage',
        handler(evt) {
          const data = evt.detail.data;
          insertChatLine(data);
          isVisible().then(visible => {
            if (!visible) {
              Utils.sendEvent('chatView:unreadMessage', { data });
            }
          });
        }
      },
      presenceEvent: {
        name: 'chatController:presenceEvent',
        handler(evt) {
          insertChatEvent(evt.detail);
        }
      },
      messageDelivered: {
        name: 'chatController:messageDelivered',
        handler() {
          chatMsgInput.value = '';
        }
      },
      chatVisibility: {
        name: 'roomView:chatVisibility',
        handler(evt) {
          _visibilityChanging = setVisibility(evt.detail);
        },
        couldBeChanged: true
      }
    };
    Array.isArray(configuredEvts) && configuredEvts.forEach(aEvt => {
      const event = eventHandlers[aEvt.type];
      event && event.couldBeChanged && (event.name = aEvt.name);
    });
    Utils.addHandlers(eventHandlers);
  }

  function initHTMLElements() {
    const chatWndElem = document.getElementById('chat');
    headerChat = chatWndElem.querySelector('header');
    closeChatBtn = chatWndElem.querySelector('#closeChat');
    sendMsgBtn = chatWndElem.querySelector('#sendTxt');
    chatMsgInput = chatWndElem.querySelector('#msgText');
    chatContainer = chatWndElem.querySelector('#chatMsgs');
    chatContent = chatContainer.querySelector('ul');
    chatForm = chatWndElem.querySelector('#chatForm');
    emojiPicker = document.querySelector('emoji-picker');
    toggleEmojiBtn = chatWndElem.querySelector('#addEmoji');
  }

  const onEmojiClicked = event => chatMsgInput.value += (" "+(event.detail.unicode)+" ")
  const toggleEmojiView = evt => {
      evt.preventDefault();
    if (emojiPicker.style.display == "none") {
        emojiPicker.style.display = "block";

    } else {
        emojiPicker.style.display = "none";
    }
  }
  const onSendClicked = evt => {
    evt.preventDefault();
    if (!chatMsgInput.value.trim().length) {
      return;
    }
    if (isMobile()) {
      document.activeElement.blur(); // Hide the virtual keyboard.
    } else {
      chatMsgInput.focus();
    }
    Utils.sendEvent('chatView:outgoingMessage', {
      sender: usrId,
      time: Utils.getCurrentTime(),
      text: chatMsgInput.value.trim()
    });
    if (emojiPicker) {
        emojiPicker.style.display = "none";
    }

  };

  const onKeyPress = ((myfield, evt) => {
    let keycode;
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
  }).bind(undefined, chatMsgInput);

  const onSubmit = evt => {
    evt.preventDefault();
    return false;
  };

  const onClose = evt => {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    _visibilityChanging = setVisibility(false);
  };

  const onToggle = () => {
    Chat.isCollapsed() ? Chat.expand() : Chat.collapse();
  };

  const onDrop = evt => {
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
    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', onEmojiClicked);
        toggleEmojiBtn.addEventListener('click', toggleEmojiView);
    }


  }

  function removeHandlers() {
    chatForm.removeEventListener('keypress', onKeyPress);
    closeChatBtn.removeEventListener('click', onClose);
    headerChat.removeEventListener('click', onToggle);
    sendMsgBtn.removeEventListener('click', onSendClicked);
    chatForm.removeEventListener('drop', onDrop);
    if (emojiPicker) {
        emojiPicker.removeEventListener('emoji-click', onEmojiClicked);
        toggleEmojiBtn.removeEventListener('click', toggleEmojiView);
    }

  }

  function insertChatEvent(data) {
    const time = (data.time || Utils.getCurrentTime()).toLowerCase();
    const item = HTMLElems.createElementAt(chatContent, 'li');
    item.classList.add('event');
    const name = data.sender || data.userName;
    const text = `${time} - ${name} ${data.text}`;
    insertText(item, text);
    scrollTo();
  }

  function insertText(elemRoot, text) {
    const txtElems = TextProcessor.parse(text);
    const targetElem = HTMLElems.createElementAt(elemRoot, 'p');
    txtElems.forEach(node => {
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
    const item = HTMLElems.createElementAt(chatContent, 'li');
    const info = HTMLElems.createElementAt(item, 'p');
    if (otHelper.isMyself({ connectionId: data.senderId })) {
      item.classList.add('yourself');
    } else {
      let chatIndex = chatParticipants.indexOf(data.senderId);
      if (chatIndex === -1) {
        chatIndex = chatParticipants.push(data.senderId) - 1;
      }
      // We only have 10 colors so just get last digit.
      const participantNumber = chatIndex.toString().slice(-1);
      info.data('participant-number', participantNumber);
    }

    const time = data.time.toLowerCase();
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
    ]).then(() => {
      initHTMLElements();
      usrId = aUsrId;
      Chat.init();
      addEventsHandlers(configuredEvts);
    });
  }

  const ChatView = {
    init
  };

  exports.ChatView = ChatView;
})(this);
