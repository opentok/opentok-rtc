var expect = chai.expect;

describe('roomStatus', () => {
  var expectedHandlers = ['signal:status', 'signal:statusACK', 'connectionCreated',
    'sessionConnected', 'connectionDestroyed'];

  function getSignalEvent(connId, date, user) {
    return {
      connection: {
        data: JSON.stringify({ userName: user }),
        creationTime: date,
        connectionId: connId,
      },
    };
  }

  before(() => {
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
  });

  it('should exist', () => {
    expect(RoomStatus).to.exist;
  });

  describe('#init', () => {
    it('should exist and be a function', () => {
      expect(RoomStatus.init).to.exist;
      expect(RoomStatus.init).to.be.a('function');
    });

    it('should initialize properly the object and return the handlers set',
       sinon.test(() => {
         var handlers = [];

         RoomStatus.init(handlers);

         expect(handlers.length).to.be.equals(1);
         var statusHandlers = handlers[0];
         expect(expectedHandlers.every(elem => statusHandlers[elem] !== undefined)).to.be.true;
       }));
  });

  describe('#handlers', () => {
    describe('#signal:status', () => {
      it('should populate room\'s status, send ack, remove the listener and ' +
         'send updatedRemotely event', sinon.test(function (done) {
           var status = {
             chat: [{
               sender: 'aSender1',
               time: Utils.getCurrentTime(),
               text: 'a text 1',
             }, {
               sender: 'aSender2',
               time: Utils.getCurrentTime(),
               text: 'a text 2',
             }],
             key2: {},
           };

           var signalEvt = {
             data: JSON.stringify(status),
             from: {
               connectionId: 'otherUser',
             },
             type: 'status',
           };

           this.spy(otHelper, 'sendSignal');
           this.spy(otHelper, 'removeListener');

        // Testing that roomStatus:updatedRemotely was called we just put
        // a listener over it, if it wasn't executed correctly we'll have a
        // time out.
           window.addEventListener('roomStatus:updatedRemotely', (evt) => {
             done();
           });

           var handlers = [];
           RoomStatus.init(handlers);

           var hndls = OTHelper.bindHandlers(handlers[0]);
           hndls['signal:status'](signalEvt);

           expect(OTHelper.sendSignal.calledWith('statusACK')).to.be.true;

           expect(OTHelper.removeListener.calledWith('signal:status')).to.be.true;
           Object.keys(status).forEach((key) => {
             expect(RoomStatus.get(key)).to.be.deep.equal(status[key]);
           });
         }));
    });

    describe('#connectionCreated', () => {
      var handlers = [];
      var statusHndls;
      var myCreationTime = (new Date(1975, 6, 6, 15, 0, 0)).getTime();
      var entries = {};

      before(() => {
        RoomStatus.init(handlers);
        statusHndls = OTHelper.bindHandlers(handlers[0]);
        statusHndls.sessionConnected({
          target: {
            connection: {
              creationTime: myCreationTime,
            },
          },
        });
      });

      function verifySend(connId, userId, creationTime) {
        var signalEvt = getSignalEvent(connId, creationTime, userId);
        statusHndls.connectionCreated(signalEvt);

        expect(OTHelper.sendSignal.calledOnce).to.be.true;
        expect(OTHelper.sendSignal.calledWith('status', entries, signalEvt.connection)).to.be.true;
      }

      it('should send status when a different user connects and I was the oldest connected one',
         sinon.test(function () {
           this.spy(OTHelper, 'sendSignal');
           var otherCreationTime = myCreationTime + 1;
           verifySend('otherConnId', 'otherUser', otherCreationTime);
         }));

      it('should send status when a different user with my same identifier connects and ' +
         ' I was the oldest connected', sinon.test(function () {
           this.spy(OTHelper, 'sendSignal');
           var otherCreationTime = myCreationTime + 1;
           verifySend('otherConnId', 'mySelf', otherCreationTime);
         }));

      it('should not send the status when a different user connects and I was not the oldest ' +
         'connected one', sinon.test(function () {
           this.spy(OTHelper, 'sendSignal');

           var otherConnectedCreationTime = myCreationTime - 1;
           var newConnectedCreationTime = myCreationTime + 1;

           statusHndls.connectionCreated(getSignalEvent('connIdfirstUsr',
                                                        otherConnectedCreationTime,
                                                        'firstUser'));
           statusHndls.connectionCreated(getSignalEvent('connNewUsr',
                                                        newConnectedCreationTime),
                                                        'newUser');

           expect(OTHelper.sendSignal.callCount).to.be.equal(0);
         }));

      it('should not send the history when I receive a connect event for myself',
         sinon.test(function () {
           this.spy(OTHelper, 'sendSignal');

           statusHndls.connectionCreated(getSignalEvent('myConnectionId',
                                                        myCreationTime,
                                                        'mySelf'));

           expect(OTHelper.sendSignal.callCount).to.be.equal(0);
         }));
    });
  });
});
