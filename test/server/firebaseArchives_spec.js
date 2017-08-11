'use strict';

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');

var FirebaseArchives = require('../../server/firebaseArchives.js');

describe('FirebaseArchives', () => {
  describe('# Object attributes', () => {
    it('should exist and be a function', () => {
      expect(FirebaseArchives).to.exist;
      expect(FirebaseArchives).to.be.a('function');
    });

    it('should have a Firebase attribute', () => {
      expect(FirebaseArchives.Firebase).to.exist;
      expect(FirebaseArchives.Firebase).to.be.a('object');
    });
  });

  describe('# Instance behavior', () => {
    const CLEANUP_TIME = 1;
    const BASE_URL = 'https://someurl.firebaseio.com';
    // The secret is a real one, only it isn't used anywhere...
    const FAKE_CREDENTIAL = 'Foocred';
    var _utInstance;
    var _fbRef;
    var _sinonClock;

    before(() => {
      _sinonClock = sinon.useFakeTimers();
      FirebaseArchives.Firebase = require('../mocks/mock_firebase');
      var fbconfig = {
        credential: FAKE_CREDENTIAL,
        dataUrl: BASE_URL
      };
      _utInstance =
        FirebaseArchives(fbconfig, CLEANUP_TIME, 'debug');
      _fbRef = FirebaseArchives.Firebase.database().ref();
    });

    after(() => {
      _sinonClock.restore();
    });

    it('should be a promise', () => {
      expect(_utInstance).to.exist;
      expect(_utInstance.then).to.be.a('function');
    });

    // The following tests are encapsulated on a try catch because otherwise Mocha eats
    // the actual exception and the only error we get is a timeout, which isn't very
    // helpful to debug any potential problems.
    it('the promise should fulfill', (done) => {
      _utInstance.then((fArchive) => {
        try {
          expect(fArchive).to.be.an('object');
          ['baseURL', 'createUserToken', 'updateArchive'].forEach((att) => {
            expect(fArchive[att]).to.exist;
          });
        } catch (e) {
          console.log('Error:', e);
          throw e;
        }
        done();
      });
    });

    describe('# baseURL', () => {
      it('should be equal to the constructor parameter', (done) => {
        _utInstance.then((fArchive) => {
          try {
            expect(fArchive.baseURL).to.equal(BASE_URL);
          } catch (e) {
            console.log('Error:', e);
            throw e;
          }
          done();
        });
      });
    });

    describe('# createUsertoken', () => {
      it('should be able to create tokens', (done) => {
        _utInstance.then((fArchive) => {
          fArchive.createUserToken('aSession', 'aUsername')
            .then((newToken) => {
              expect(newToken).to.be.a('string');
              done();
            })
            .catch(done);
        });
      });
    });

    var testArchive = {
      id: 'anId',
      att1: 'value1',
      att2: 'value2',
    };

    var testArchive2 = {
      id: 'aSecondId',
      att1: 'value21',
      att2: 'value22',
    };
    var testSession = 'sessionId';

    // Note than these tests actually depend on the previous ones

    describe('# updateArchive', () => {
      it('should be able to add elements', (done) => {
        _utInstance.then((fArchive) => {
          fArchive.updateArchive(testSession, testArchive).then(() => {
            done();
          })
          .catch(done);
        });
      });
    });

    describe('# removeArchive', () => {
      it('should be able to remove elements', (done) => {
        _utInstance.then((fArchive) => {
          var upd1 = fArchive.updateArchive(testSession, testArchive);
          var upd2 = fArchive.updateArchive(testSession, testArchive2);
          Promise.all([upd1, upd2]).then(() => {
            // Prerequisites set. Now...
            fArchive.removeArchive(testSession, testArchive2.id).then(() => {
              done();
            });
          })
          .catch(done);
        });
      });
    });

    describe('# shutdown', () => {
      it('should stop processing events', (done) => {
        _utInstance.then((fArchive) => {
          fArchive.updateArchive(testSession, testArchive)
            .then(() => {
              fArchive.shutdown();
              done();
            })
            .catch(err);
        });
      });
    });
  });
});
