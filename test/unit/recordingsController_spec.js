var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsController', function() {

  describe('#init', function() {
    it('should be initialized properly', sinon.test(function(done) {
      var expectedRoomName = 'pse';

      sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
        expect(resources.length).to.equal(2);
        expect(resources[0]).to.equal('/js/models/firebase.js');
        expect(resources[1]).to.equal('/js/recordingsView.js');
        return Promise.resolve();
      });

      sinon.stub(window, 'FirebaseModel', function(roomName) {
        expect(roomName).to.equal(expectedRoomName);
      });

      sinon.stub(RecordingsView, 'init', function() {
        FirebaseModel.restore();
        RecordingsView.init.restore();
        LazyLoader.dependencyLoad.restore();
        done();
      });

      RecordingsController.init(expectedRoomName);
    }));
  });

});
