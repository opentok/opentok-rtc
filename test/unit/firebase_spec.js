var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FirebaseModel', function() {

  var roomName = 'pse';

  it('should exist', function() {
    expect(FirebaseModel).to.exist;
  });

  describe('#constructor()', function(){
    it('should be created properly', function() {
      var model = new FirebaseModel(roomName);
      expect(model.roomName).to.equal(roomName);
      expect(model.baseURL).to.equal('https://opentok-recordings.firebaseio.com/');
    });
  });

  describe('#init()', function(){
    it('should export a init function', function() {
      var model = new FirebaseModel(roomName);
      expect(model.init).to.exist;
      expect(model.init).to.be.a('function');
    });
  });

  describe('#onValue()', function(){
    it('should export an onValue function', function() {
      var model = new FirebaseModel(roomName);
      expect(model.onValue).to.exist;
      expect(model.onValue).to.be.a('function');
    });

    it('should return values', function(done) {
      var snapshot = {
        'a': 'a'
      };

      var model = new FirebaseModel(roomName);
      model.videosRef = {
        on: function(event, callback) {
          callback({
            val: function() {
              return snapshot;
            }
          })
        }
      };

      model.onValue(function(result) {
        expect(result).to.equal(snapshot);
        done();
      });
    });
  });

});
