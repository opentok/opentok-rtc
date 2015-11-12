var expect = chai.expect;

describe('roomStatus', function() {

  var expectedHandlers = ['signal:status', 'signal:statusACK', 'connectionCreated',
                          'sessionConnected', 'connectionDestroyed'];

  function getSignalEvent(user, date) {
    return {
      connection: {
        data: JSON.stringify({ userName: user }),
        creationTime: date,
        connectionId: 'querty'
      }
    };
  }

  before(function() {
    window.MockOTHelper._install();
  });

  after(function() {
    window.MockOTHelper._restore();
  });

  it('should exist', function() {
    expect(RoomStatus).to.exist;
  });

  describe('#init', function() {
    it('should exist and be a function', function() {
      expect(RoomStatus.init).to.exist;
      expect(RoomStatus.init).to.be.a('function');
    });

    it('should initialize properly the object and return the handlers set',
       sinon.test(function() {
      var handlers = [];

      RoomStatus.init('mySelf', handlers);

      expect(handlers.length).to.be.equals(1);
      var statusHandlers = handlers[0];
      expect(expectedHandlers.every(function(elem) {
        return statusHandlers[elem] !== undefined;
      })).to.be.true;
    }));
  });

  describe('#handlers', function() {
    describe('#signal:status', function() {
      it('should populate room\'s status, send ack, remove the listener and ' +
         'send updatedRemotely event', sinon.test(function(done) {

        var status = {
         'chat': [{
             sender: 'aSender1',
             time: Utils.getCurrentTime(),
             text: 'a text 1'
           }, {
             sender: 'aSender2',
             time: Utils.getCurrentTime(),
             text: 'a text 2'
           }],
         'key2': {}
        };

        var signalEvt = {
          data: JSON.stringify(status),
          from: 'from',
          type: 'status'
        };

        this.spy(OTHelper, 'sendSignal');
        this.spy(OTHelper, 'removeListener');

        // Testing that roomStatus:updatedRemotely was called we just put
        // a listener over it, if it wasn't executed correctly we'll have a
        // time out.
        window.addEventListener('roomStatus:updatedRemotely', function(evt) {
          done();
        });

        var handlers = [];
        RoomStatus.init('mySelf', handlers);

        var hndls = handlers[0];
        hndls['signal:status'](signalEvt);

        expect(OTHelper.sendSignal.calledWith({
          type: 'statusACK',
          data: 'mySelf'
        })).to.be.true;

        expect(OTHelper.removeListener.calledWith('signal:status')).to.be.true;
        Object.keys(status).forEach(function(key) {
          expect(RoomStatus.get(key)).to.be.deep.equal(status[key]);
        });
      }));
    });

    describe('#connectionCreated', function() {

      var usr = 'mySelf';
      var handlers = [];
      var statusHndls;
      var myCreationTime = (new Date(1975, 06, 06, 15, 0, 0)).getTime();
      var entries = {};

      before(function() {
        RoomStatus.init(usr, handlers);
        statusHndls = handlers[0];
        statusHndls['sessionConnected']({
          target: {
            connection: {
              creationTime: myCreationTime
            }
          }
        });
      });

      it('should send status when a different user connects and I was the oldest connected one',
         sinon.test(function() {

        this.spy(OTHelper, 'sendSignal');

        var otherCreationTime = myCreationTime + 1;

        var signalEvt = getSignalEvent('otherUser', otherCreationTime);
        statusHndls['connectionCreated'](signalEvt);

        expect(OTHelper.sendSignal.calledOnce).to.be.true;
        expect(OTHelper.sendSignal.calledWith({
          type: 'status',
          to: signalEvt.connection,
          data: JSON.stringify(entries)
        })).to.be.true;
      }));

      it('should not send the status when a different user connects and I was not the oldest ' +
         'connected one', sinon.test(function() {

        this.spy(OTHelper, 'sendSignal');

        var otherConnectedCreationTime = myCreationTime - 1;
        var newConnectedCreationTime = myCreationTime + 1;

        statusHndls['connectionCreated'](getSignalEvent('firstUser', otherConnectedCreationTime));
        statusHndls['connectionCreated'](getSignalEvent('newUser', newConnectedCreationTime));

        expect(OTHelper.sendSignal.callCount).to.be.equal(0);
      }));

      it('should not send the history when I receive a connect event for myself',
         sinon.test(function() {

        this.spy(OTHelper, 'sendSignal');

        statusHndls['connectionCreated'](getSignalEvent(usr, myCreationTime));

        expect(OTHelper.sendSignal.callCount).to.be.equal(0);
      }));
    });
  });
});
