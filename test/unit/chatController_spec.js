var expect = chai.expect;

describe('ChatController', function() {

  var expectedHandlers = ['signal:chat', 'signal:chatHistory', 'signal:chatHistoryACK',
                          'connectionCreated', 'sessionConnected', 'connectionDestroyed'];

  var data = {
    sender: 'aSender',
    time: Utils.getCurrentTime(),
    text: 'a text'
  };

  function getSignalEvent(date, user) {
    return {
      connection: {
        data: JSON.stringify({ userName: user }),
        creationTime: date,
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
       function(done) {
      var handlers = [];
      ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
        expect(aHandlers.length).to.be.equals(1);
        expect(expectedHandlers.every(function(elem) {
          return aHandlers[elem] !== 'undefined';
        })).to.be.true;
        done();
      });
    });
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

    describe('#signal:chatHistory', function() {
      it('should populate the chat with the history and remove the listener',
         sinon.test(function(done) {
        var historyChat = [{
          sender: 'aSender1',
          time: Utils.getCurrentTime(),
          text: 'a text 1'
        }, {
          sender: 'aSender2',
          time: Utils.getCurrentTime(),
          text: 'a text 2'
        }];

        var signalEvt = {
          data: JSON.stringify(historyChat),
          from: 'from',
          type: 'chatHistory'
        };

        this.spy(OTHelper, 'removeListener');
        this.spy(OTHelper, 'sendSignal');
        this.stub(ChatView, 'insertChatLine');

        var handlers = [];
        ChatController.init('testRoomName', 'testUserName', handlers).then(function(aHandlers) {
          var chatHndls = aHandlers[0];

          chatHndls['signal:chatHistory'](signalEvt);
          expect(ChatView.insertChatLine.callCount).to.be.equal(historyChat.length);
          expect(ChatView.insertChatLine.firstCall.calledWith(historyChat[0])).to.be.true;
          expect(ChatView.insertChatLine.secondCall.calledWith(historyChat[1])).to.be.true;

          var spyCall;
          for(var i = 0, l = historyChat.length; i < l; i++) {
            spyCall = ChatView.insertChatLine.getCall(i);
            expect(spyCall.args[0]).to.be.deep.equal(historyChat[i]);
          }

          expect(OTHelper.sendSignal.calledWith({
            type: 'chatHistoryACK',
            data: 'testUserName'
          })).to.be.true;

          expect(OTHelper.removeListener.calledWith('signal:chatHistory')).to.be.true;
          done();
        });
      }));
    });

    describe('#connectionCreated', function() {

      var usr = 'mySelf';
      var room = 'room';
      var handlers = [];
      var chatHndls;
      var myCreationTime = (new Date(1975, 06, 06, 15, 0, 0)).getTime();

      before(function(done) {
        ChatController.init(room, usr, handlers).then(function(aHandlers) {
          handlers  = aHandlers;
          chatHndls = aHandlers[0];
          chatHndls['sessionConnected']({
            target: {
              connection: {
                creationTime: myCreationTime
              }
            }
          });

          done();
        });
      });

      it('should send history when a different user connects and I was the oldest connected one',
         sinon.test(function() {

        this.stub(ChatView, 'insertChatEvent');
        this.spy(OTHelper, 'sendSignal');

        var otherCreationTime = myCreationTime + 1;

        chatHndls['connectionCreated'](getSignalEvent(otherCreationTime, 'otherUser'));

        expect(ChatView.insertChatEvent.calledOnce).to.be.true;
        expect(ChatView.insertChatEvent.calledWith('otherUser has connected')).to.be.true;
        expect(OTHelper.sendSignal.calledOnce).to.be.true;
      }));

      it('should not send the history when a different user connects and I was not the oldest ' +
         'connected one', sinon.test(function() {

        this.stub(ChatView, 'insertChatEvent');
        this.spy(OTHelper, 'sendSignal');

        var otherConnectedCreationTime = myCreationTime - 1;
        var newConnectedCreationTime = myCreationTime + 1;

        chatHndls['connectionCreated'](getSignalEvent(otherConnectedCreationTime, 'firstUser'));
        chatHndls['connectionCreated'](getSignalEvent(newConnectedCreationTime, 'newUser'));

        expect(ChatView.insertChatEvent.calledTwice).to.be.true;
        expect(ChatView.insertChatEvent.firstCall.calledWith('firstUser has connected')).
               to.be.true;
        expect(ChatView.insertChatEvent.secondCall.calledWith('newUser has connected')).
               to.be.true;

        expect(OTHelper.sendSignal.callCount).to.be.equal(0);
      }));

      it('should not send the history when I receive a connect event for myself',
         sinon.test(function() {

        this.stub(ChatView, 'insertChatEvent');
        this.spy(OTHelper, 'sendSignal');

        chatHndls['connectionCreated'](getSignalEvent(myCreationTime, usr));

        expect(ChatView.insertChatEvent.callCount).to.be.equal(0);
        expect(OTHelper.sendSignal.callCount).to.be.equal(0);
      }));
    });

    describe('#connectionDestroyed', function() {

      it('should add a line informing that a user has disconnected', sinon.test(function(done) {
        this.stub(ChatView, 'insertChatEvent');
        var handlers = [];

        ChatController.init('testRoomName', 'mySelf', handlers).then(function(aHandlers) {
          var chatHndls = aHandlers[0];
          var myCreationTime = (new Date(1975, 06, 06, 15, 0, 2)).getTime();

          chatHndls['sessionConnected']({
            target: {
              connection: {
                creationTime: myCreationTime
              }
            }
          });
          chatHndls['connectionDestroyed'](getSignalEvent(myCreationTime, 'mySelf'));

          expect(ChatView.insertChatEvent.calledOnce).to.be.true;
          expect(ChatView.insertChatEvent.calledWith('mySelf has disconnected')).
                 to.be.true;
          done();
        });
      }));
    });
  });
});
