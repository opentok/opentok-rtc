/* global Chat, TextProcessor, otHelper */
"use strict";
export class ChatView {

  constructor(aUsrId, configuredEvts) {
     this.chatParticipants = [];
     this._visibilityChanging = Promise.resolve();
     this.eventHandlers = {}
    return LazyLoader.dependencyLoad([
      '/js/helpers/textProcessor.js',
      '/js/components/chat.js'
    ]).then(() => {
      initHTMLElements();
      this.usrId = aUsrId;
      Chat.init();
      addEventsHandlers(configuredEvts);
    });
  }

   isMobile() { return typeof window.orientation !== 'undefined'; }

   isVisible() {
    return this._visibilityChanging.then(() => {
      return Chat.visible;
    });
  }

   setVisibility(isVisible) {
    if (isVisible) {
      addHandlers();
      return Chat.show().then(() => {
        Utils.sendEvent('chatView:shown');
        scrollTo();
        this.chatMsgInput.focus();
      });
    }
    removeHandlers();
    return Chat.hide().then(() => {
      Utils.sendEvent('chatView:hidden');
    });
  }


   addEventsHandlers(configuredEvts) {
    this.eventHandlers = {
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
          this.chatMsgInput.value = '';
        }
      },
      chatVisibility: {
        name: 'roomView:chatVisibility',
        handler(evt) {
          this._visibilityChanging = setVisibility(evt.detail);
        },
        couldBeChanged: true
      }
    };
    Array.isArray(configuredEvts) && configuredEvts.forEach(aEvt => {
      const event = this.eventHandlers[aEvt.type];
      event && event.couldBeChanged && (event.name = aEvt.name);
    });
    Utils.addHandlers(this.eventHandlers);
  }

   initHTMLElements() {
    const chatWndElem = document.getElementById('chat');
    this.headerChat = chatWndElem.querySelector('header');
    this.closeChatBtn = chatWndElem.querySelector('#closeChat');
    this.sendMsgBtn = chatWndElem.querySelector('#sendTxt');
    this.chatMsgInput = chatWndElem.querySelector('#msgText');
    this.chatContainer = chatWndElem.querySelector('#chatMsgs');
    this.chatContent = this.chatContainer.querySelector('ul');
    this.chatForm = chatWndElem.querySelector('#chatForm');
  }

   onSendClicked (evt) {
    evt.preventDefault();
    if (!this.chatMsgInput.value.trim().length) {
      return;
    }
    if (isMobile()) {
      document.activeElement.blur(); // Hide the virtual keyboard.
    } else {
      this.chatMsgInput.focus();
    }
    Utils.sendEvent('chatView:outgoingMessage', {
      sender: this.usrId,
      time: Utils.getCurrentTime(),
      text: this.chatMsgInput.value.trim()
    });
  };

   onKeyPress = ((myfield, evt) => {
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
  }).bind(undefined, this.chatMsgInput);

   onSubmit = evt => {
    evt.preventDefault();
    return false;
  };

   onClose = evt => {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    this._visibilityChanging = setVisibility(false);
  };

   onToggle = () => {
    Chat.isCollapsed() ? Chat.expand() : Chat.collapse();
  };

   onDrop = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  };

  // The ChatController should have the handlers and call the view for
  // doing visual work
   addHandlers() {
    this.chatForm.addEventListener('keypress', onKeyPress);
    this.chatForm.addEventListener('submit', onSubmit);
    this.chatForm.addEventListener('drop', onDrop);
    this.closeChatBtn.addEventListener('click', onClose);
    this.eaderChat.addEventListener('click', onToggle);
    this.sendMsgBtn.addEventListener('click', onSendClicked);
  }

   removeHandlers() {
    this.chatForm.removeEventListener('keypress', onKeyPress);
    this.closeChatBtn.removeEventListener('click', onClose);
    this.headerChat.removeEventListener('click', onToggle);
    this.sendMsgBtn.removeEventListener('click', onSendClicked);
    this.chatForm.removeEventListener('drop', onDrop);
  }

   insertChatEvent(data) {
    const time = (data.time || Utils.getCurrentTime()).toLowerCase();
    const item = HTMLElems.createElementAt(this.chatContent, 'li');
    item.classList.add('event');
    const name = data.sender || data.userName;
    const text = `${time} - ${name} ${data.text}`;
    insertText(item, text);
    scrollTo();
  }

   insertText(elemRoot, text) {
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

   insertChatLine(data) {
    const item = HTMLElems.createElementAt(this.chatContent, 'li');
    const info = HTMLElems.createElementAt(item, 'p');
    if (otHelper.isMyself({ connectionId: data.senderId })) {
      item.classList.add('yourself');
    } else {
      let chatIndex = this.chatParticipants.indexOf(data.senderId);
      if (chatIndex === -1) {
        chatIndex = this.chatParticipants.push(data.senderId) - 1;
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

   scrollTo() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }
}