var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FirebaseModel', () => {
  var roomName = 'pse';
  var baseURL = 'https://opentok-recordings.firebaseio.com/';

  // To test this we need ../mocks/mock_firebase.js and of course mockfirebase.js to be included.
  // If that's included correctly then window.MockCachedFirebase will be defined
  before(() => {
    window._Firebase = window.Firebase;
    window.Firebase = window.MockCachedFirebase;
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
  });

  after(() => {
    window.Firebase = window._Firebase;
    window._Firebase = undefined;
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(FirebaseModel).to.exist;
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(FirebaseModel.init).to.exist;
      expect(FirebaseModel.init).to.be.a('function');
    });


    it('should return a promise, and it should fulfill', (done) => {
      initPromise = FirebaseModel.init(baseURL, 'fakeToken');
      expect(initPromise.then).to.be.a('function');
      initPromise.then(() => {
        done();
      });
    });

    it('should create a connection object on the session', () => {
      var reference = window.Firebase.references[baseURL];
      expect(reference).to.exist;
      var sessionObject = window.Firebase.references[baseURL].getData();
      expect(sessionObject.connections).to.exist;
      var keys = Object.keys(sessionObject.connections);
      expect(keys.length).to.be.at.least(1);
    });
  });


  // Since FirebaseModel is a single object, from now on it has been initialized
  // correctly or the previous test failed.
  describe('#*EventListener()', () => {
    it('allows setting and removing different handlers', () => {
      var handler1 = sinon.spy();
      var handler2 = sinon.spy();
      FirebaseModel.addEventListener('event', handler1);
      FirebaseModel.addEventListener('event', handler2);
      expect(FirebaseModel.removeEventListener('event', handler1)).to.be.true;
      expect(FirebaseModel.removeEventListener('event', sinon.spy())).to.be.false;
      expect(FirebaseModel.removeEventListener('event', handler2)).to.be.true;
    });

    it('should invoke the set functions when the data changes', (done) => {
      var ref = window.Firebase.references[baseURL];
      var archives = {
        archid1: { att1: 'value1', att2: 'value2' },
        archid1: { att1: 'value1', att2: 'value2' }, // eslint-disable-line no-dupe-keys
      };
      var numHandlersCalled = 0;
      var handlersSet = 3;
      var handlerFunc = function (data) {
        numHandlersCalled++;
        expect(data).to.deep.equal(archives);
        if (numHandlersCalled === handlersSet) {
          done();
        }
      };

      for (var i = 0; i < handlersSet; i++) {
        FirebaseModel.addEventListener('value', handlerFunc);
      }

      ref.child('archives').set(archives);
    });
  });
});
