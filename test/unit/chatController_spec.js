var sinonTest = require('sinon-test');

var test = sinonTest(sinon);
sinon.test = test;
var { expect } = chai;
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

describe('ChatController', () => {
  var expectedHandlers = ['signal:chat', 'connectionCreated', 'connectionDestroyed'];
  var STATUS_KEY = 'chat';

  var data = {
    sender: 'aSender',
    time: Utils.getCurrentTime(),
    text: 'a text',
  };

  function getSignalEvent(user, connectionId) {
    return {
      connection: {
        data: JSON.stringify({ userName: user }),
        connectionId,
      },
    };
  }

  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad').callsFake((resources) => Promise.resolve());
    sinon.stub(ChatView, 'init').callsFake(() => Promise.resolve());

    window.MockRoomStatus._install();
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
    window.MockRoomStatus._restore();
    ChatView.init.restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(ChatController).to.exist;
  });

  describe('#init', () => {
    it('should exist and be a function', () => {
      expect(ChatController.init).to.exist;
      expect(ChatController.init).to.be.a('function');
    });

    function verifyInit(done, handlerShouldHave, handlersName) {
      ChatController.init('testUserName', [], handlersName)
        .then((aHandlers) => {
          expect(aHandlers.length).to.be.equals(1);
          var chatHandlers = aHandlers[0];
          expectedHandlers.every((elem) => { // eslint-disable-line array-callback-return
            expect(chatHandlers[elem]).to.not.be.undefined;
          });
          var spyArg = Utils.addHandlers.getCall(0).args[0];
          expect(Object.keys(spyArg).length).to.be
            .equal(Object.keys(handlerShouldHave).length);
          expect(Object.keys(spyArg)
            .every((action) => spyArg[action].name === handlerShouldHave[action].name)).to.be.true;
          console.log(JSON.stringify(RoomStatus.set));
          expect(RoomStatus.set.calledWith(STATUS_KEY, [])).to.be.true;
          done();
        }).catch((err) => console.log(err));
    }

    it('should initialize properly the object and return the handlers set when called without '
       + 'handlers', (done) => {
      var expectedHandlers = {
        updatedRemotely: {
          name: 'roomStatus:updatedRemotely',
          couldBeChanged: true,
        },
        outgoingMessage: {
          name: 'chatView:outgoingMessage',
        },
      };
      sinon.stub(RoomStatus, 'set').callsFake(() => Promise.resolve());
      sinon.stub(Utils, 'addHandlers').callsFake(() => {});
      verifyInit(done, expectedHandlers);
      RoomStatus.set.restore();
      Utils.addHandlers.restore();
    });

    it('should initialize properly the object and return the handlers set when called with '
       + 'handlers', sinon.test((done) => {
      var expectedHandlers = {
        updatedRemotely: {
          name: 'changedRoomStatus:changedUpdatedRemotely',
          couldBeChanged: true,
        },
        outgoingMessage: {
          name: 'chatView:outgoingMessage',
        },
      };

      var handlersName = [
        {
          type: 'updatedRemotely',
          name: 'changedRoomStatus:changedUpdatedRemotely',
        }, {
          type: 'chatVisibility',
          name: 'roomView:chatVisibility',
        }];
      sinon.stub(RoomStatus, 'set').callsFake(() => Promise.resolve());
      sinon.stub(Utils, 'addHandlers').callsFake(() => {});

      verifyInit(done, expectedHandlers, handlersName);
    }));
  });

  describe('#handlers OT', () => {
    describe('#signal:chat', () => {
      it('should inform that a incoming message has been received', sinon.test((done) => {
        var signalEvt = {
          data: JSON.stringify(data),
          from: { connectionId: 'myConnId' },
          type: 'chat',
        };
        var handlers = [];
        window.addEventListener('chatController:incomingMessage', function handlerTest(evt) {
          window.removeEventListener('chatController:incomingMessage', handlerTest);
          data.senderId = 'myConnId';
          expect(evt.detail.data).to.be.deep.equal(data);
          done();
        });

        ChatController.init('testUserName', handlers).then((aHandlers) => {
          var chatHndls = aHandlers[0];
          chatHndls['signal:chat'](signalEvt);
        });
      }));
    });

    describe('#connectionCreated', () => {
      var usr = 'mySelf';
      var room = 'room';
      var handlers = [];
      var chatHndls;

      before((done) => {
        ChatController.init(usr, handlers).then((aHandlers) => {
          handlers = aHandlers;
          chatHndls = window.MockOTHelper.bindHandlers(aHandlers[0]);
          done();
        });
      });

      it('should insert new user connected event when a different user connects',
        sinon.test((done) => {
          var connData = {
            userName: 'otherUser',
            text: 'has joined the call',
          };

          OTHelper._myConnId = 'myConnId';

          window.addEventListener('chatController:presenceEvent', function handlerTest(evt) {
            window.removeEventListener('chatController:presenceEvent', handlerTest);
            expect(evt.detail).to.be.deep.equal(connData);
            done();
          });

          chatHndls.connectionCreated(getSignalEvent(connData.userName, 'otherConnId'));
        }));

      it('should not do anything when I receive a connect event for myself',
        sinon.test(() => {
          var connData = {
            userName: 'mySelf',
            text: 'has joined the call',
          };

          OTHelper._myConnId = 'myConnId';

          sinon.spy(window, 'dispatchEvent');
          chatHndls.connectionCreated(getSignalEvent(connData.userName, OTHelper._myConnId));
          expect(window.dispatchEvent.called).to.be.false;
        }));
    });

    describe('#connectionDestroyed', () => {
      it('should add a line informing that a user has disconnected', sinon.test((done) => {
        var handlers = [];

        ChatController.init('mySelf', handlers).then((aHandlers) => {
          var chatHndls = window.MockOTHelper.bindHandlers(aHandlers[0]);

          var disconnData = {
            userName: 'otherUsr',
            text: 'has left the call',
          };

          OTHelper._myConnId = 'myConnId';

          window.addEventListener('chatController:presenceEvent', function handlerTest(evt) {
            window.removeEventListener('chatController:presenceEvent', handlerTest);
            expect(evt.detail).to.be.deep.equal(disconnData);
            done();
          });

          chatHndls.connectionDestroyed(getSignalEvent(disconnData.userName, 'otherConnId'));
        });
      }));
    });
  });

  describe('#updatedRemotely event', () => {
    var sharedHistory = [{
      sender: 'aSender1',
      time: Utils.getCurrentTime(),
      text: 'a text 1',
    }, {
      sender: 'aSender2',
      time: Utils.getCurrentTime(),
      text: 'a text 2',
    }];

    var eventCount;
    var loadHistoryTest;

    before(() => {
      eventCount = 0;
    });

    after(() => {
      window.removeEventListener('chatController:incomingMessage', loadHistoryTest);
    });

    it('should load chat history', sinon.test((done) => {
      sinon.stub(RoomStatus, 'get').callsFake((key) => sharedHistory);

      var handlers = [];

      loadHistoryTest = function (evt) {
        var { data } = evt.detail;
        expect(data).to.be.deep.equal(sharedHistory[eventCount++]);
        if (eventCount === sharedHistory.length) {
          done();
        }
      };

      window.addEventListener('chatController:incomingMessage', loadHistoryTest);

      ChatController.init('testUserName', handlers).then((aHandlers) => {
        window.dispatchEvent(new CustomEvent('roomStatus:updatedRemotely'));
      });
    }));
  });

  describe('#outgoingMessage event', () => {
    it('should send the message using an OT signal', sinon.test((done) => {
      sinon.stub(OTHelper, 'sendSignal').callsFake((evt) => Promise.resolve());

      var handlers = [];
      var resolver;
      var handlerExecuted = new Promise((resolve, reject) => {
        resolver = resolve;
      });

      window.addEventListener('chatController:messageDelivered', function handlerTest(evt) {
        window.removeEventListener('chatController:messageDelivered', handlerTest);
        resolver();
      });

      ChatController.init('testUserName', handlers).then((aHandlers) => {
        window.dispatchEvent(new CustomEvent('chatView:outgoingMessage', { detail: data }));

        expect(OTHelper.sendSignal.calledWith('chat', data)).to.be.true;
        handlerExecuted.then(done);
      });
    }));
  });
});
