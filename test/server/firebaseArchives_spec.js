'use strict';

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');

var FirebaseArchives  = require('../../server/firebaseArchives.js');

describe('FirebaseArchives', function() {

  describe('# Object attributes', function() {
    it('should exist and be a function', function(){
      expect(FirebaseArchives).to.exist;
      expect(FirebaseArchives).to.be.a('function');
    });

    it('should have a Firebase attribute', function() {
      expect(FirebaseArchives.Firebase).to.exist;
      expect(FirebaseArchives.Firebase).to.be.a('function');
    });
  });

  describe('# Instance behavior', function() {

    const CLEANUP_TIME = 1;
    const BASE_URL = 'https://someurl.firebaseio.com';
    // The secret is a real one, only it isn't used anywhere...
    const SECRET = '1Hi5bT3aQg8vcKbARR1gQ8wLcJx7bAxNd2XTsrVd';
    var _utInstance;
    var _fbReferences;
    var _sinonClock;

    before(function() {
      _sinonClock = sinon.useFakeTimers();
      FirebaseArchives.Firebase = require('../mocks/mock_firebase');
      _utInstance =
        FirebaseArchives(BASE_URL, SECRET, CLEANUP_TIME);
      _fbReferences = FirebaseArchives.Firebase.references;
    });

    after(function() {
      _sinonClock.restore();
    });

    it('should be a promise', function() {
      expect(_utInstance).to.exist;
      expect(_utInstance.then).to.be.a('function');
    });

    // The following tests are encapsulated on a try catch because otherwise Mocha eats
    // the actual exception and the only error we get is a timeout, which isn't very
    // helpful to debug any potential problems.
    it('should fulfill', function(done) {
      _utInstance.then(fArchive => {
        try {
          expect(fArchive).to.be.an('object');
          ['baseURL', 'createUserToken', 'updateArchive'].forEach(att => {
            expect(fArchive[att]).to.exist;
          });
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

    it('should have a baseURL equal to the constructor parameter', function(done) {
      _utInstance.then(fArchive => {
        try {
          expect(fArchive.baseURL).to.equal(BASE_URL);
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

    it('should be able to create tokens', function(done) {
      _utInstance.then(fArchive => {
        try {
          var newToken = fArchive.createUserToken('aSession', 'aUsername');
          expect(newToken).to.be.a('string');
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

    var testArchive = {
      id: 'anId',
      att1: 'value1',
      att2: 'value2'
    };
    var testSession = 'sessionId';

    // Note than these tests actually depend on the previous ones
    it('should be able to add elements', function(done) {
      _utInstance.then(fArchive => {
        try {
          fArchive.updateArchive(testSession, testArchive);
          var newArchiveRef = _fbReferences[BASE_URL].child(testSession + '/archives');
          var data = newArchiveRef.getData();
          expect(data[testArchive.id]).to.deep.equal(testArchive);
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

    it('should not clean sessions with live connections', function(done) {
      _utInstance.then(fArchive => {
        try {
          var newConnection =
            _fbReferences[BASE_URL].child(testSession + '/connections').push('test');
          // Let's check than we still have the data...
          var archiveRef = _fbReferences[BASE_URL].child(testSession);
          var data = archiveRef.getData();
          expect(data).to.exist;

          // Advance the time
          _sinonClock.tick(CLEANUP_TIME * 60 * 1001);

          // And since we have live connections the data should be still alive
          data = archiveRef.getData();
          expect(data).to.exist;
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

    it('should clean empty sessions after the configured time', function(done) {
      _utInstance.then(fArchive => {
        try {
          // Let's check than we still have the data...
          var archiveRef = _fbReferences[BASE_URL].child(testSession);
          var data = archiveRef.getData();
          expect(data).to.exist;

          // Now kill any connections...
          _fbReferences[BASE_URL].child(testSession + '/connections').remove();

          // Advance the time
          _sinonClock.tick(CLEANUP_TIME * 60 * 1001);

          // And the data should have gone away
          data = archiveRef.getData();
          expect(data).to.not.exist;
        } catch(e) {
          console.log('Error', e);
          throw e;
        }
        done();
      });
    });

  });

});
