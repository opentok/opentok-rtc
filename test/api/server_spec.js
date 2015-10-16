var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');

var request = require('supertest');

describe('OpenTokRTC server', function() {
  'use strict';

  var app, MockOpentok;

  // Note that since everything is in api.json, we could just parse
  // that and generate the test cases automatically. At the moment
  // it's more work than doing it manually though, so not worth it.

  before(function(done) {
    var fs = require('fs');

    MockOpentok = require('../mocks/mock_opentok.js');

    // Note that we're not actually testing anything that uses Firebase here. They'll
    // have their own unit tests. We're only avoiding using it at all.
    var mocks = {
      Opentok: MockOpentok,
      Firebase: require('../mocks/mock_firebase')
    };

    var mockFirebase;

    // Note that this actually executes on the level where the Grunt file is
    // So that's what '.' is. OTOH, the requires are relative to *this* file.
    // Yep, I don't like that either. Nope, I can't do anything about that.
    fs.readFile('./api.json', function(err, data) {
      // Create the app with the json we've just read. The third parameter is
      // the app loglevel. Disable logs for the tests.
      app = require('../../server/app')('../../web', data, 0, mocks);

      done();
    });
  });

  after(function() {
    MockOpentok.restoreInstances();
  });

  // Note that everything needed to test this is actually in api.json, but it's not
  // really worth it at this point to try to do this generic. So for now we'll just do
  // it manually.
  function checkForAttributes(aAttributes, aRes) {
    var aObject = aRes.body;
    for (var i = 0, l = aAttributes.length; i < l ; i++) {
      if (!aObject[aAttributes[i]]) {
        console.log("aRes.body", aRes.body);
        throw new Error('Missing required attribute: ' + aAttributes[i] +
                        ' in ' + JSON.stringify(aObject));
      }
    }
    return undefined;
  }

  // Objects that can be returned:
  const RoomInfo = ['sessionId', 'apiKey', 'token', 'username'];
  const ArchiveInfo = ['archiveId', 'archiveType'];
  const ArchiveURL = ['archiveId'];
  const ReturnError = ['code', 'message', 'fields'];

  it('GET /room/:roomName/info', function(done) {
    request(app).
      get('/room/unitTestRoom/info').
      set('Accept', 'application/json').
      expect('Content-Type', new RegExp('application/json')).
      expect(checkForAttributes.bind(undefined, RoomInfo)).
      expect(200, done);
  });

  it('GET /room/:roomName/info?userName=xxxYYY', function(done) {
    request(app).
      get('/room/unitTestRoom/info?userName=xxxYYY').
      set('Accept', 'application/json').
      expect('Content-Type', new RegExp('application/json')).
      expect(checkForAttributes.bind(undefined, RoomInfo)).
      expect(function(aRes) {
        if (aRes.body.username != 'xxxYYY') {
          throw new Error('The response username should coincide with the passed one');
        }
      }).
      expect(200, done);
  });

  // To-Do: This is a very basic test that only tests that we get something. Replace this with
  // something useful
  it('GET /room/:roomName', function(done) {
    request(app).
      get('/room/roomName').
      set('Accept', 'text/html').
      expect('Content-Type', new RegExp('text/html')).
      expect(200, done);
  });

  it('POST /room/:roomName/archive should allow composite archiving', function(done) {
    request(app).
      post('/room/unitTestRoom/archive').
      send('userName=xxxYYY&operation=startComposite').
      expect(checkForAttributes.bind(undefined, ArchiveInfo)).
      expect(200, done);
  });

  it('POST /room/:roomName/archive should allow stopping the archive', function(done) {
    request(app).
      post('/room/unitTestRoom/archive').
      send('userName=xxxYYY&operation=stop').
      expect(checkForAttributes.bind(undefined, ArchiveInfo)).
      expect(200, done);
  });

  it('POST /room/:roomName/archive should allow individual archiving', function(done) {
    request(app).
      post('/room/unitTestRoom/archive').
      send('userName=xxxYYY&operation=startIndividual').
      expect(checkForAttributes.bind(undefined, ArchiveInfo)).
      expect(200, done);
  });

  // Temporary test, TBD later
  it('GET /archive/:archiveId', function(done) {
    request(app).
      get('/archive/12345').
      expect(405, done);
  });

  it('DELETE /archive/:archiveId', function(done) {
    request(app).
      delete('/archive/12345').
      expect(405, done);
  });


});
