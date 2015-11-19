var expect = chai.expect;

describe('ChatView', function() {

  var container = null;
  var chatContainer = null;
  var ROOM_NAME_TEST = 'roomNameTest';

  var ChatController = {
    isGoingToWork: true,
    error: '',
    sendMsg: function() {
      if (this.isGoingToWork) {
        return new Promise.resolve();
      } else {
        return new Promise.reject(this.error);
      }
    }
  };

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

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });
    window.document.body.innerHTML = window.__html__['test/unit/chatView_spec.html'];
  });

  after(function() {
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', function() {
    expect(ChatView).to.exist;
  });

  describe('#init', function() {
    it('should exist and be a function', function() {
      expect(ChatView.init).to.exist;
      expect(ChatView.init).to.be.a('function');
    });

    it('should set the chat\'s room name and init the Chat object', sinon.test(function(done) {
      this.spy(Chat, 'init');
      ChatView.init('usr', ROOM_NAME_TEST).then(function() {
        expect(Chat.init.calledOnce).to.be.true;
        done();
      });
    }));
  });

  describe('#visible', function() {
    it('should be a LHV and RHV', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible should not be a setter!! ' +
                    'because it is asynchronous');
      console.error('TO-DO!!! refactor it');
    });
  });

  describe('#insertChatLine', function() {
    var data = {
      sender: 'sender',
      time: Utils.getCurrentTime(),
      text: 'This is  a   line https://uno.com  http://dos.com/index.html   http://tres.com'
    };

    it('should add a new text line correctly', function() {
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

      var chatContent = getChatContainer().querySelector('ul');
      var lengthBefore = chatContent.children.length;

      ChatView.insertChatLine(data);

      expect(chatContent.children.length).to.be.equal(lengthBefore + 1);

      var newLine = chatContent.lastChild;
      expect(newLine.children.length).to.be.equal(1);

      var p = newLine.lastChild;
      expect(p.children.length).to.be.equal(3);

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
    });
  });

  describe('#insertChatEvent', function() {
    it('should add a new event correctly', function() {
      var data = {
        userName: 'usr1',
        text: '(has connected)',
        time: '00:00am'
      };

      var chatContent = getChatContainer().querySelector('ul');
      var lengthBefore = chatContent.children.length;
      ChatView.insertChatEvent(data);
      expect(chatContent.children.length).to.be.equal(lengthBefore + 1);
      var newLine = chatContent.lastChild;
      expect(newLine.querySelector('.time').textContent).to.be.equal(data.time);
      expect(newLine.querySelector('.sender').textContent).to.be.equal(data.userName);
      expect(newLine.querySelector('p p:last-child').textContent).to.be.equal(data.text);
    });
  });

  describe('#keypress', function() {
    it('should not do anything when chat is hidden', sinon.test(function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');

      /*
       The test should be something like:
      var chatForm = getContainer().querySelector('#chatForm');
      this.spy(ChatController, 'sendMsg');

      var keyEvt = document.createEvent('KeyboardEvent');
      var initMethod = (typeof keyEvt.initKeyboardEvent !== 'undefined') ?
                         'initKeyboardEvent' :
                         'initKeyEvent';
      keyEvt[initMethod]
         ('keypress', //evn type: keydown, keyup or keypress
          true, // bubbles
          true, // cancelable
          window, // viewArg: should be window
          false, // ctrlKeyArg
          false, // altKeyArg
          false, // shiftKeyArg
          false, // metaKeyArg
          13, // keyCodeArg : unsigned long the virtual key code, else 0
          0 // charCodeArgs : unsigned long the Unicode character associated with
            // the depressed key, else 0
         );
      ChatView.visible = false;
      chatForm.dispatchEvent(keyEvt);
      expect(ChatController.sendMsg.called).to.be.false;
       */
    }));

    it('should send the text content and clean text field when chat is visible ' +
       'when return key is pressed', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');

    });
    it('should not do anything when chat is visible and key pressed is not return key', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');

    });
  });

  describe('#click on closeChatBtn', function() {
    it('should hide the chat when the chat is visible', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');

    });
    it('should not do anything when the chat is hidden', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');
    });
  });

  describe('#click on sendMsgBtn', function() {
    it('should send the text written when chat is visible and return key is pressed', function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');
    });
    it('should not send the text written when chat is hidden and return key is pressed',
       function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');
    });
    it('should not send the text written when chat is visible and key pressed is not return key',
       function() {
      console.error('[PSE-102]');
      console.error('WARNING!!!! ChatView.visible (setter) is asynchronous' +
                    'and we can not do a test over whatever function that' +
                    'should be tester after ChatView.visible is setted');
      console.error('TO-DO!!! refactor it');
    });
  });
});
