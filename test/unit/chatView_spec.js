var expect = chai.expect;

describe('ChatView', () => {
  var container = null;
  var chatContainer = null;
  var chatTextArea = null;
  var ROOM_NAME_TEST = 'roomNameTest';

  function getMouseClickEvt() {
    return new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
  }

  function dispatchKeyEvent(keyPressed) {
    var keyEvt = document.createEvent('KeyboardEvent');
    var initMethod = (typeof keyEvt.initKeyboardEvent !== 'undefined') ?
          'initKeyboardEvent' :
          'initKeyEvent';
    Object.defineProperty(keyEvt, 'keyCode', {
      get() {
        return this.keyCodeVal;
      }
    });
    Object.defineProperty(keyEvt, 'which', {
      get() {
        return this.keyCodeVal;
      }
    });

    var keyCode = keyPressed.charCodeAt(0);

    keyEvt[initMethod](
      'keypress', // evn type: keydown, keyup or keypress
       true,       // bubbles
       true,       // cancelable
       window,     // viewArg: should be window
       false,      // ctrlKeyArg
       false,      // altKeyArg
       false,      // shiftKeyArg
       false,      // metaKeyArg
       keyCode,    // keyCodeArg : unsigned long the virtual key code
       0);         // charCodeArgs : unsigned long the Unicode character
                   // associated with the depressed key, else 0

    keyEvt.keyCodeVal = keyCode;
    chatForm.dispatchEvent(keyEvt);
  }

  function getContainer() {
    if (!container) {
      container = document.getElementById('chat');
    }
    return container;
  }

  function getChatContainer() {
    if (!chatContainer) {
      chatContainer = getContainer().querySelector('#chatMsgs');
    }
    return chatContainer;
  }

  function getChatTextArea() {
    if (!chatTextArea) {
      chatTextArea = getContainer().querySelector('#msgText');
    }
    return chatTextArea;
  }

  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    window.MockOTHelper._install();
    window.MockChat._install();
    window.document.body.innerHTML = window.__html__['test/unit/chatView_spec.html'];
  });

  after(() => {
    window.MockChat._restore();
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(ChatView).to.exist;
  });

  describe('#init', () => {
    function verifyInit(context, done, handlerShouldHave, configuredHandlers) {
      context.stub(Utils, 'addHandlers');
      context.spy(Chat, 'init');
      ChatView.init('myself', ROOM_NAME_TEST, configuredHandlers).then(() => {
        expect(Chat.init.calledOnce).to.be.true;
        var spyArg = Utils.addHandlers.getCall(0).args[0];
        expect(Object.keys(spyArg).length).to.be.equal(Object.keys(handlerShouldHave).length);
        expect(Object.keys(spyArg).every(action =>
          spyArg[action].name === handlerShouldHave[action].name)).to.be.true;
        done();
      });
    }

    it('should exist and be a function', () => {
      expect(ChatView.init).to.exist;
      expect(ChatView.init).to.be.a('function');
    });

    it('should set the chat\'s room name and init the Chat object when called without configured ' +
       'handlers', sinon.test(function (done) {
         var handlersShouldHave = {
           incomingMessage: {
             name: 'chatController:incomingMessage',
           },
           presenceEvent: {
             name: 'chatController:presenceEvent',
           },
           messageDelivered: {
             name: 'chatController:messageDelivered',
           },
           chatVisibility: {
             name: 'roomView:chatVisibility',
             couldBeChanged: true,
           },
         };
         verifyInit(this, done, handlersShouldHave);
       }));

    it('should set the chat\'s room name and init the Chat object when called with configured ' +
       'handlers', sinon.test(function (done) {
         var handlersShouldHave = {
           incomingMessage: {
             name: 'chatController:incomingMessage',
           },
           presenceEvent: {
             name: 'chatController:presenceEvent',
           },
           messageDelivered: {
             name: 'chatController:messageDelivered',
           },
           chatVisibility: {
             name: 'changedRoomView:changedChatVisibility',
             couldBeChanged: true,
           },
         };
         var configuredHandlers = [
           {
             type: 'updatedRemotely',
             name: 'changedRoomStatus:changedUpdatedRemotely',
           }, {
             type: 'chatVisibility',
             name: 'changedRoomView:changedChatVisibility',
           }];
         verifyInit(this, done, handlersShouldHave, configuredHandlers);
       }));
  });

  describe('#incomingMessage event', () => {
    var data = {
      sender: 'sender',
      time: Utils.getCurrentTime(),
      text: 'This is  a   line https://uno.com  http://dos.com/index.html   http://tres.com',
    };

    function testSpan(domElem, txt, classValue) {
      expect(domElem.nodeName).to.be.equal('SPAN');
      expect(domElem.innerHTML).to.be.equal(txt);
      classValue && expect(domElem.classList.contains(classValue)).to.be.true;
    }

    function testTxt(domElem, txt) {
      expect(domElem.nodeName).to.be.equal('#text');
      expect(domElem.textContent).to.be.equal(txt);
    }

    function testA(domElem, url, txt) {
      expect(domElem.nodeName).to.be.equal('A');
      expect(domElem.target).to.be.equal('_blank');
      expect(domElem.href).to.be.equal(url);
      expect(domElem.text).to.be.equal(txt);
    }

    function testVisualElems(chatContent, lengthBefore, isMyself) {
      expect(chatContent.children.length).to.be.equal(lengthBefore + 1);

      var newLine = chatContent.lastChild;
      expect(newLine.children.length).to.be.equal(1);

      var p = newLine.lastChild;
      expect(p.children.length).to.be.equal(3);

      isMyself = !!isMyself;
      expect(p.classList.contains('yourself')).to.be.equal(isMyself);

      testSpan(p.childNodes[0], data.time.toLowerCase(), 'time');
      testSpan(p.childNodes[1], data.sender, 'sender');

      var elem = p.childNodes[2];
      expect(elem.nodeName).to.be.equal('P');
      expect(elem.childNodes.length).to.be.equal(6);
      testTxt(elem.childNodes[0], 'This is  a   line ');
      testA(elem.childNodes[1], 'https://uno.com/', 'https://uno.com');
      testTxt(elem.childNodes[2], '  ');
      testA(elem.childNodes[3], 'http://dos.com/index.html', 'http://dos.com/index.html');
      testTxt(elem.childNodes[4], '   ');
      testA(elem.childNodes[5], 'http://tres.com/', 'http://tres.com');
    }

    before((done) => {
      ChatView.init('myself', ROOM_NAME_TEST).then(() => {
        done();
      });
    });

    it('should add a new text line correctly when chat is visible and sender is yourself',
       sinon.test(function () {
         var chatContent = getChatContainer().querySelector('ul');
         var lengthBefore = chatContent.children.length;

         Chat._isVisible = true;
         this.spy(window, 'dispatchEvent');
         data.sender = 'myself';
         window.dispatchEvent(new CustomEvent('chatController:incomingMessage',
                                           { detail: { data } }));

         testVisualElems(chatContent, lengthBefore, true);
         expect(window.dispatchEvent.calledOnce).to.be.true;
       }));

    it('should add a new text line correctly when chat is visible and sender is other',
       sinon.test(function () {
         var chatContent = getChatContainer().querySelector('ul');
         var lengthBefore = chatContent.children.length;
         data.sender = 'other';

         Chat._isVisible = true;
         this.spy(window, 'dispatchEvent');
         window.dispatchEvent(new CustomEvent('chatController:incomingMessage',
                                           { detail: { data } }));

         testVisualElems(chatContent, lengthBefore, false);
         expect(window.dispatchEvent.calledOnce).to.be.true;
       }));

    it('should add a new text line correctly when chat is hidden', sinon.test((done) => {
      var chatContent = getChatContainer().querySelector('ul');
      var lengthBefore = chatContent.children.length;

      window.addEventListener('chatView:unreadMessage', function handlerTest(evt) {
        window.removeEventListener('chatView:unreadMessage', handlerTest);
        expect(evt.detail.data).to.be.deep.equal(data);
        testVisualElems(chatContent, lengthBefore);
        done();
      });

      Chat._isVisible = false;
      window.dispatchEvent(new CustomEvent('chatController:incomingMessage',
                                           { detail: { data } }));
    }));
  });

  describe('#presenceEvent event', () => {
    it('should add a new event correctly', () => {
      var data = {
        userName: 'usr1',
        text: '(has connected)',
        time: '00:00am',
      };

      var chatContent = getChatContainer().querySelector('ul');
      var lengthBefore = chatContent.children.length;

      window.dispatchEvent(new CustomEvent('chatController:presenceEvent', { detail: data }));

      expect(chatContent.children.length).to.be.equal(lengthBefore + 1);
      var newLine = chatContent.lastChild;
      expect(newLine.querySelector('.time').textContent).to.be.equal(data.time);
      expect(newLine.querySelector('.sender').textContent).to.be.equal(data.userName);
      expect(newLine.querySelector('p p:last-child').textContent).to.be.equal(data.text);
    });
  });

  describe('#messageDelivered event', () => {
    it('should clean input text area', () => {
      var textArea = getChatTextArea();
      textArea.value = 'It has text';

      window.dispatchEvent(new CustomEvent('chatController:messageDelivered'));

      expect(textArea.value).to.be.equal('');
    });
  });

  describe('#chatVisibility event', () => {
    it('should hid chat when receives false', sinon.test(function () {
      this.spy(Chat, 'show');
      this.spy(Chat, 'hide');

      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: false }));

      expect(Chat.show.called).to.be.false;
      expect(Chat.hide.called).to.be.true;
    }));

    it('should show when it receives true', sinon.test(function () {
      this.spy(Chat, 'show');
      this.spy(Chat, 'hide');

      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));

      expect(Chat.show.called).to.be.true;
      expect(Chat.hide.called).to.be.false;
    }));
  });

  describe('#keypress', () => {
    var chatForm;

    before(() => {
      chatForm = getContainer().querySelector('#chatForm');
    });

    it('should send the text content when chat is visible, textArea has content and ' +
       'return key is pressed', sinon.test((done) => {
         var textArea = getChatTextArea();
         textArea.value = 'It has text';

         window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));

         window.addEventListener('chatView:outgoingMessage', function handlerTest(evt) {
           window.removeEventListener('chatView:outgoingMessage', handlerTest);
           expect(evt.detail.sender).to.be.equal('myself');
           expect(evt.detail.text).to.be.equal(textArea.value);
           done();
         });
         dispatchKeyEvent('\r');
       }));

    it('should not do anything when chat is visible, textArea is empty and ' +
       'return key is pressed', sinon.test(function () {
         window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));
         var textArea = getChatTextArea();
         textArea.value = '';

         this.spy(window, 'dispatchEvent');
         dispatchKeyEvent('\r');
         expect(window.dispatchEvent.called).to.be.false;
       }));

    it('should not do anything when chat is visible and key pressed is not return key',
        sinon.test(function () {
          window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));
          var textArea = getChatTextArea();
          textArea.value = 'It has text';

          this.spy(window, 'dispatchEvent');
          dispatchKeyEvent('a');
          expect(window.dispatchEvent.called).to.be.false;
        }));

    it('should not do anything when chat is hidden', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: false }));

      this.spy(window, 'dispatchEvent');
      dispatchKeyEvent('\r');
      expect(window.dispatchEvent.called).to.be.false;
    }));
  });

  describe('#click on closeChatBtn', () => {
    var closeChatBtn;

    before(() => {
      closeChatBtn = getContainer().querySelector('#closeChat');
    });

    it('should hide the chat when the chat is visible', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));
      this.spy(Chat, 'hide');
      this.spy(Chat, 'show');
      this.spy(Chat, 'expand');
      this.spy(Chat, 'collapse');

      closeChatBtn.dispatchEvent(getMouseClickEvt());

      expect(Chat.show.called).to.be.false;
      expect(Chat.hide.called).to.be.true;
      expect(Chat.expand.called).to.be.false;
      expect(Chat.collapse.called).to.be.false;
    }));

    it('should not do anything when the chat is hidden', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: false }));
      this.spy(Chat, 'hide');
      this.spy(Chat, 'show');
      this.spy(Chat, 'expand');
      this.spy(Chat, 'collapse');

      closeChatBtn.dispatchEvent(getMouseClickEvt());

      expect(Chat.show.called).to.be.false;
      expect(Chat.hide.called).to.be.false;
      expect(Chat.expand.called).to.be.false;
      expect(Chat.collapse.called).to.be.false;
    }));
  });

  describe('#click on toggleChatBtn', () => {
    var toggleChatBtn;

    before(() => {
      toggleChatBtn = getContainer().querySelector('header');
    });

    it('should expand when the chat is visible and collapsed', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));
      this.spy(Chat, 'expand');
      this.spy(Chat, 'collapse');
      this.spy(Chat, 'hide');
      this.spy(Chat, 'show');

      Chat._isCollapsed = true;

      toggleChatBtn.dispatchEvent(getMouseClickEvt());

      expect(Chat.expand.called).to.be.true;
      expect(Chat.collapse.called).to.be.false;
      expect(Chat.hide.called).to.be.false;
      expect(Chat.show.called).to.be.false;
    }));

    it('should collapse when the chat is visible and not collapsed', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));

      this.spy(Chat, 'expand');
      this.spy(Chat, 'collapse');
      this.spy(Chat, 'hide');
      this.spy(Chat, 'show');

      Chat._isCollapsed = false;

      toggleChatBtn.dispatchEvent(getMouseClickEvt());

      expect(Chat.expand.called).to.be.false;
      expect(Chat.collapse.called).to.be.true;
      expect(Chat.hide.called).to.be.false;
      expect(Chat.show.called).to.be.false;
    }));

    it('should not do anything when the chat is hidden', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: false }));

      this.spy(Chat, 'expand');
      this.spy(Chat, 'collapse');
      this.spy(Chat, 'hide');
      this.spy(Chat, 'show');

      Chat._isCollapsed = false;

      toggleChatBtn.dispatchEvent(getMouseClickEvt());

      expect(Chat.expand.called).to.be.false;
      expect(Chat.collapse.called).to.be.false;
      expect(Chat.hide.called).to.be.false;
      expect(Chat.show.called).to.be.false;
    }));
  });

  describe('#click on sendMsgBtn', () => {
    var sendMsgBtn;

    before(() => {
      sendMsgBtn = getContainer().querySelector('#sendTxt');
    });

    it('should send chatView:outgoingMessage when the chat is visible and textArea has content',
       sinon.test((done) => {
         window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));

         var textArea = getChatTextArea();
         textArea.value = 'It has text';

         window.addEventListener('chatView:outgoingMessage', function handlerTest(evt) {
           window.removeEventListener('chatView:outgoingMessage', handlerTest);
           expect(evt.detail.sender).to.be.equal('myself');
           expect(evt.detail.text).to.be.equal(textArea.value);
           done();
         });

         sendMsgBtn.dispatchEvent(getMouseClickEvt());
       }));

    it('should not do anything when the chat is visible and textArea is empty',
       sinon.test(function () {
         window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: true }));

         var textArea = getChatTextArea();
         textArea.value = '';

         this.spy(window, 'dispatchEvent');

         sendMsgBtn.dispatchEvent(getMouseClickEvt());
         expect(window.dispatchEvent.called).to.be.false;
       }));

    it('should not do anything when the chat is hidden', sinon.test(function () {
      window.dispatchEvent(new CustomEvent('roomView:chatVisibility', { detail: false }));

      var textArea = getChatTextArea();
      textArea.value = 'It has text';

      this.spy(window, 'dispatchEvent');

      sendMsgBtn.dispatchEvent(getMouseClickEvt());

      expect(window.dispatchEvent.called).to.be.false;
    }));
  });
});
