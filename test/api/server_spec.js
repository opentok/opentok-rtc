var chai = require('chai');
var request = require('supertest');

var expect = chai.expect;

const TEST_LOG_LEVEL = 0;

describe('OpenTokRTC server', () => {
  'use strict';

  var app, MockOpentok;

  // Note that since everything is in api.yml, we could just parse
  // that and generate the test cases automatically. At the moment
  // it's more work than doing it manually though, so not worth it.

  before((done) => {
    MockOpentok = require('../mocks/mock_opentok.js');
    process.env.TEMPLATING_SECRET = '123456';

    // Note that we're not actually testing anything that uses Firebase here. They'll
    // have their own unit tests. We're only avoiding using it at all.
    var mocks = {
      Opentok: MockOpentok,
      Firebase: require('../mocks/mock_firebase'),
    };

    // Note that this actually executes on the level where the Grunt file is
    // So that's what '.' is. OTOH, the requires are relative to *this* file.
    // Yep, I don't like that either. Nope, I can't do anything about that.
    var YAML = require('yamljs');
    var loadYAML =
         apiFile => new Promise((resolve, reject) => {
           try {
             YAML.load(apiFile, resolve);
           } catch (e) {
             reject(e);
           }
         });
    loadYAML('./api.yml').then((apiSpec) => {
      app = (require('swagger-boilerplate').App)({
        modulePath: __dirname + '/../../server/', // eslint-disable-line no-path-concat
        staticPath: '../../web',
        apiDef: apiSpec,
        logLevel: TEST_LOG_LEVEL,
      }, mocks);
      done();
    });
  });

  after(() => {
    MockOpentok.restoreInstances();
  });

  // Note that everything needed to test this is actually in api.json, but it's not
  // really worth it at this point to try to do this generic. So for now we'll just do
  // it manually.
  function checkForAttributes(aAttributes, aRes) {
    var aObject = aRes.body;
    for (var i = 0, l = aAttributes.length; i < l; i++) {
      if (!aObject[aAttributes[i]]) {
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
  const ReturnError = ['code', 'message'];

  it('GET /room/:roomName/info', (done) => {
    request(app)
      .get('/room/unitTestRoom/info')
      .set('Accept', 'application/json')
      .expect('Content-Type', new RegExp('application/json'))
      .expect(checkForAttributes.bind(undefined, RoomInfo))
      .expect(200, done);
  });

  it('GET /room/:roomName/info, roomName should ignore caps', (done) => {
    function getInfo(aRoomName) {
      return new Promise((resolve) => {
        var sessionId;
        function getSessionId(aRes) {
          sessionId = aRes && aRes.body && aRes.body.sessionId;
        }
        var solve = () => resolve(sessionId);
        request(app)
          .get('/room/' + aRoomName + '/info')
          .set('Accept', 'application/json')
          .expect('Content-Type', new RegExp('application/json'))
          .expect(checkForAttributes.bind(undefined, RoomInfo))
          .expect(getSessionId)
          .expect(200, solve);
      });
    }
    Promise.all([getInfo('UNITTESTROOM'), getInfo('unitTestRoom')])
      .then((aResults) => {
        expect(aResults[0]).to.be.equal(aResults[1]);
        done();
      });
  });

  it('GET /room/:roomName/info?userName=xxxYYY', (done) => {
    request(app)
      .get('/room/unitTestRoom/info?userName=xxxYYY')
      .set('Accept', 'application/json')
      .expect('Content-Type', new RegExp('application/json'))
      .expect(checkForAttributes.bind(undefined, RoomInfo))
      .expect((aRes) => {
        if (aRes.body.username !== 'xxxYYY') {
          throw new Error('The response username should coincide with the passed one');
        }
      })
      .expect(200, done);
  });

  // To-Do: This is a very basic test that only tests that we get something. Replace this with
  // something useful
  it('GET /room/:roomName', (done) => {
    request(app)
      .get('/room/roomName')
      .set('Accept', 'text/html')
      .expect('Content-Type', new RegExp('text/html'))
      .expect(200, done);
  });

  it('GET /room/:roomName?template=room', (done) => {
    request(app)
      .get('/room/roomName?template=room')
      .set('Accept', 'text/html')
      .expect('Content-Type', new RegExp('text/html'))
      .expect(200, done);
  });

  it('GET /room/:roomName?template=unknownTemplate without auth, return default', (done) => {
    request(app)
      .get('/room/roomName?template=unknownTemplate')
      .set('Accept', 'text/html')
      .expect('Content-Type', new RegExp('text/html'))
      .expect(200, done);
  });

  it('GET /room/:roomName?template=unknownTemplate&template_auth=1234 invalid auth',
    (done) => {
      request(app)
      .get('/room/roomName?template=unknownTemplate&template_auth=1234')
      .set('Accept', 'text/html')
      .expect('Content-Type', new RegExp('text/html'))
      .expect(200, done);
    });

  it('GET /room/:roomName?template=unknownTemplate&template_auth=123456 valid auth',
    (done) => {
      request(app)
      .get('/room/roomName?template=unknownTemplate&template_auth=123456')
      .set('Accept', 'application/json')
      .expect('Content-Type', new RegExp('application/json'))
      .expect(checkForAttributes.bind(undefined, ReturnError))
      .expect(400, done);
    });

  it('POST /room/:roomName/archive should allow composite archiving', (done) => {
    request(app)
      .post('/room/unitTestRoom/archive')
      .send('userName=xxxYYY&operation=startComposite')
      .expect(checkForAttributes.bind(undefined, ArchiveInfo))
      .expect(200, done);
  });

  it('POST /room/:roomName/archive should allow stopping the archive', (done) => {
    request(app)
      .post('/room/unitTestRoom/archive')
      .send('userName=xxxYYY&operation=stop')
      .expect(checkForAttributes.bind(undefined, ArchiveInfo))
      .expect(200, done);
  });

  it('POST /room/:roomName/archive should allow individual archiving', (done) => {
    request(app)
      .post('/room/unitTestRoom/archive')
      .send('userName=xxxYYY&operation=startIndividual')
      .expect(checkForAttributes.bind(undefined, ArchiveInfo))
      .expect(200, done);
  });

  // Temporary tests, TBD later
  it('GET /archive/:archiveId', (done) => {
    request(app)
      .get('/archive/12345')
      .expect(405, done);
  });

  it('DELETE /archive/:archiveId', (done) => {
    request(app)
      .delete('/archive/12345')
      .expect(405, done);
  });

  // This test looks stupid but... updateArchiveInfo should return 200 always.
  it('POST /updateArchiveInfo', (done) => {
    request(app)
      .post('/updateArchiveInfo')
      .expect(200, done);
  });

  it('GET /room/:roomName/archive should return 404 for not existing archive', (done) => {
    request(app)
      .get('/room/' + Math.random() + '/archive')
      .expect(404, done);
  });
});
