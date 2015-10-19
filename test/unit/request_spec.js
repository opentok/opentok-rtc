var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Request', function() {

  var setRequestHeader = sinon.FakeXMLHttpRequest.prototype.setRequestHeader;

  before(function() {
    // overrideMimeType does not exist in FakeXMLHttpRequest
    sinon.FakeXMLHttpRequest.prototype.overrideMimeType = function() {};
    sinon.FakeXMLHttpRequest.prototype.setRequestHeader = function(header, value) {
      // Refused to set unsafe header "Content-Length"
      ('Content-Length' !== header) && setRequestHeader.apply(this, arguments);
    };
  });

  after(function() {
    sinon.FakeXMLHttpRequest.prototype.setRequestHeader = setRequestHeader;
  });

  beforeEach(function() {
    this.xhr = sinon.useFakeXMLHttpRequest();

    this.requests = [];
    this.xhr.onCreate = function(xhr) {
      this.requests.push(xhr);
    }.bind(this);
  });

  afterEach(function() {
      this.xhr.restore();
  });

  describe('#sendArchivingOperation', function() {
    var data = {
      roomName: 'pse',
      userName: 'Michael'
    };

    it('should exist and be a function', function() {
      expect(Request.sendArchivingOperation).to.exist;
      expect(Request.sendArchivingOperation).to.be.a('function');
    });

    it('implements the client API for POST /room/:roomName/archive', function(done) {
      var response = {
        id: 'asdadnajfbq47fu4fgw7q8g4f'
      };

      Request.sendArchivingOperation(data).then(function(aResponse) {
        expect(aResponse).to.deep.equal(response);
        done();
      });

      var req = this.requests[0];
      expect(req.url).to.contains(data.roomName);
      expect(req.requestBody).to.equal('roomName=' + data.roomName +
                                       '&userName=' + data.userName);
      req.respond(200, { 'Content-Type': 'text/json' }, JSON.stringify(response));
    });

    it('does not receive response when request fails', function(done) {
      Request.sendArchivingOperation(data).then(function(aResponse) {
        expect(aResponse).to.be.null;
        done();
      });

      var req = this.requests[0];
      req.respond(500);
    });
  });

});
