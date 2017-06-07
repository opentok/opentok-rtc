var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Request', () => {
  var setRequestHeader = sinon.FakeXMLHttpRequest.prototype.setRequestHeader;

  before(() => {
    // overrideMimeType does not exist in FakeXMLHttpRequest
    sinon.FakeXMLHttpRequest.prototype.overrideMimeType = function () {};
    sinon.FakeXMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      // Refused to set unsafe header "Content-Length"
      (header !== 'Content-Length') && setRequestHeader.apply(this, arguments); // eslint-disable-line prefer-rest-params
    };
  });

  after(() => {
    sinon.FakeXMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
  });

  beforeEach(function () {
    this.xhr = sinon.useFakeXMLHttpRequest();

    this.requests = [];
    this.xhr.onCreate = function (xhr) {
      this.requests.push(xhr);
    }.bind(this);
  });

  afterEach(function () {
    this.xhr.restore();
  });

  describe('#sendArchivingOperation', () => {
    var data = {
      roomName: 'pse',
      userName: 'Michael',
    };

    it('should exist and be a function', () => {
      expect(Request.sendArchivingOperation).to.exist;
      expect(Request.sendArchivingOperation).to.be.a('function');
    });

    it('implements the client API for POST /room/:roomName/archive', function (done) {
      var response = {
        id: 'asdadnajfbq47fu4fgw7q8g4f',
      };

      Request.sendArchivingOperation(data).then((aResponse) => {
        expect(aResponse).to.deep.equal(response);
        done();
      });

      var req = this.requests[0];
      expect(req.url).to.contains(data.roomName);
      expect(req.requestBody).to.equal('roomName=' + data.roomName +
                                       '&userName=' + data.userName);
      req.respond(200, { 'Content-Type': 'text/json' }, JSON.stringify(response));
    });

    it('does not receive response when request fails', function (done) {
      Request.sendArchivingOperation(data).catch((error) => {
        done();
      });

      var req = this.requests[0];
      req.respond(500);
    });
  });

  describe('#deleteArchive', () => {
    var id = 'myId';

    it('should exist and be a function', () => {
      expect(Request.deleteArchive).to.exist;
      expect(Request.deleteArchive).to.be.a('function');
    });

    it('implements the client API for DELETE /archive/:id', function (done) {
      var response = {
        id,
      };

      Request.deleteArchive(id).then((aResponse) => {
        expect(aResponse).to.deep.equal(response);
        done();
      });

      var req = this.requests[0];
      expect(req.url).to.contains(id);
      req.respond(200, { 'Content-Type': 'text/json' }, JSON.stringify(response));
    });

    it('does not receive response when request fails', function (done) {
      Request.deleteArchive(id).catch((error) => {
        expect(error).to.be.object;
        done();
      });

      var req = this.requests[0];
      req.respond(405);
    });
  });
});
