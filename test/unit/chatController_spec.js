var expect = chai.expect;

describe('ChatController', function() {

  var expectedHandlers = ['signal:chat', 'connectionCreated', 'connectionDestroyed'];
  var STATUS_KEY = 'chat';

  var data = {
    sender: 'aSender',
    time: Utils.getCurrentTime(),
    text: 'a text'
  };

  function getSignalEvent(user) {
    return {
      connection: {
        data: JSON.stringify({ userName: user }),
        connectionId: 'querty'
      }
    };
  }

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });
    sinon.stub(ChatView, 'init', function() {
      return Promise.resolve();
    });

    window.MockOTHelper._install();
  });

  after(function() {
    window.MockOTHelper._restore();
    ChatView.init.restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', function() {
    expect(ChatController).to.exist;
  });

  describe('#init', function() {
    it('should exist and be a function', function() {
      expect(ChatController.init).to.exist;
      expect(ChatController.init).to.be.a('function');
    });

    it('should initialize properly the object and return the handlers set',
       sinon.test(function(done) {
      var handlers = [];
      this.stub(RoomStatus, 'set');

      ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
        expect(aHandlers.length).to.be.equals(1);
        var chatHandlers = aHandlers[0];
        expect(expectedHandlers.every(function(elem) {
          return chatHandlers[elem] !== undefined;
        })).to.be.true;

        expect(RoomStatus.set.calledWith(STATUS_KEY, [])).to.be.true;
        done();
      });
    }));
  });

  describe('#sendMsg', function() {
    it('should send the message as a Opentok signal', sinon.test(function(done) {
      this.spy(OTHelper, 'sendSignal');
      var handlers = [];

      ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
        ChatController.sendMsg(data);

        expect(OTHelper.sendSignal.calledOnce).to.be.true;
        expect(OTHelper.sendSignal.calledWith({
          type: 'chat',
          data: JSON.stringify(data)
        })).to.be.true;

        done();
      });
    }));
  });

  describe('#handlers', function() {
    describe('#signal:chat', function() {
      it('should add a chat line', sinon.test(function(done) {
        var signalEvt = {
          data: JSON.stringify(data),
          from: 'from',
          type: 'chat'
        };
        var handlers = [];
        this.stub(ChatView, 'insertChatLine');
        ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
          var chatHndls = aHandlers[0];
          chatHndls['signal:chat'](signalEvt);
          expect(ChatView.insertChatLine.calledWith(data)).to.be.true;
          done();
        });
      }));
    });

    describe('#connectionCreated', function() {

      var usr = 'mySelf';
      var room = 'room';
      var handlers = [];
      var chatHndls;

      before(function(done) {
        ChatController.init(room, usr, handlers).then(function(aHandlers) {
          handlers  = aHandlers;
          chatHndls = aHandlers[0];
          done();
        });
      });

      it('should insert new user connected event when a different user connects',
         sinon.test(function() {

        this.stub(ChatView, 'insertChatEvent');

        chatHndls['connectionCreated'](getSignalEvent('otherUser'));

        expect(ChatView.insertChatEvent.calledOnce).to.be.true;
        expect(ChatView.insertChatEvent.calledWith({
          userName: 'otherUser',
          text: '(has connected)'
        })).to.be.true;
      }));

      it('should not do anything when I receive a connect event for myself',
         sinon.test(function() {

        this.stub(ChatView, 'insertChatEvent');

        chatHndls['connectionCreated'](getSignalEvent(usr));

        expect(ChatView.insertChatEvent.callCount).to.be.equal(0);
      }));
    });

    describe('#connectionDestroyed', function() {

      it('should add a line informing that a user has disconnected', sinon.test(function(done) {
        this.stub(ChatView, 'insertChatEvent');
        var handlers = [];

        ChatController.init('testRoomName', 'mySelf', handlers).then(function(aHandlers) {
          var chatHndls = aHandlers[0];

          chatHndls['connectionDestroyed'](getSignalEvent('mySelf'));

          expect(ChatView.insertChatEvent.calledOnce).to.be.true;
          expect(ChatView.insertChatEvent.calledWith({
            userName: 'mySelf',
            text: '(left the room)'
          })).to.be.true;
          done();
        });
      }));
    });
  });

  describe('#updatedRemotly event', function() {
    it('should load chat history', sinon.test(function(done) {
      var sharedHistory = [{
          sender: 'aSender1',
          time: Utils.getCurrentTime(),
          text: 'a text 1'
        }, {
          sender: 'aSender2',
          time: Utils.getCurrentTime(),
          text: 'a text 2'
        }
      ];

      this.stub(RoomStatus, 'get', function(key) {
        return sharedHistory;
      });

      this.stub(ChatView, 'insertChatLine');

      var handlers = [];

      ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
        window.dispatchEvent(new CustomEvent('roomStatus:updatedRemotely'));

        expect(RoomStatus.get.calledWith(STATUS_KEY)).to.be.true;
        var spyCall;
        for(var i = 0, l = sharedHistory.length; i < l; i++) {
          spyCall = ChatView.insertChatLine.getCall(i);
          expect(spyCall.args[0]).to.be.deep.equal(sharedHistory[i]);
        }
        done();
      });
    }));
  });

});
