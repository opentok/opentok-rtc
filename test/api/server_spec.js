var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');

var request = require('supertest');

describe('OpenTokRTC_V2 server', function() {
  var app;

  // Note that since everything is in api.json, we could just parse
  // that and generate the test cases automatically. At the moment
  // it's more work than doing it manually though, so not worth it.

  before(function(done) {
    var fs = require('fs');
    // Note that this actually executes on the level where the Grunt file is
    // So that's what '.' is. OTOH, the requires are relative to *this* file.
    fs.readFile('./api.json', function(err, data) {
      // Create the app with the json we've just read. The third parameter is
      // the app loglevel. Disable logs for the tests.
      app = require('../../server/app')('../../web', data, 0);

      done();
    });

  });



  // Note that everything needed to test this is actually in api.json, but it's not
  // really worth it at this point to try to do this generic. So for now we'll just do
  // it manually.
  function checkForAttributes(aAttributes, aRes) {
    var aObject = aRes.body;
    for(var i = 0, l = aAttributes.length; i < l ; i++) {
      if (!aObject[aAttributes[i]]) {
        console.log('returning early!');
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
      get('/room/test/info').
      set('Accept', 'application/json').
      expect('Content-Type', new RegExp('application/json')).
      expect(checkForAttributes.bind(undefined, RoomInfo)).
      expect(200, done);
  });

  it('GET /room/:roomName/info?userName=xxxYYY', function(done) {
    request(app).
      get('/room/test/info?userName=xxxYYY').
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
      post('/room/roomname/archive').
      send({username: 'xxxYYY', operation: 'startComposite'}).
      expect(405, done);
  });

  it('POST /room/:roomName/archive should allow composite archiving', function(done) {
    request(app).
      post('/room/roomname/archive').
      send({username: 'xxxYYY', operation: 'startIndividual'}).
      expect(405, done);
  });

  it('POST /room/:roomName/archive should allow stopping', function(done) {
    request(app).
      post('/room/roomname/archive').
      send({username: 'xxxYYY', operation: 'startIndividual'}).
      expect(405, done);
  });

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
