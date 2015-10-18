var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsController', function() {

  describe('#init', function() {
    it('should exist', function() {
      expect(RecordingsController.init).to.exist;
    });

    it('should be initialized properly', sinon.test(function(done) {
      this.stub(LazyLoader, 'dependencyLoad', function(resources) {
        return Promise.resolve();
      });
      this.stub(RecordingsView, 'init', function() {
        done();
      });
      this.stub(FirebaseModel, 'init', function(valA, valB) {
        expect(valA).to.be.equal('valueA');
        expect(valB).to.be.equal('valueB');
        return Promise.resolve();
      });
      RecordingsController.init('valueA', 'valueB');
    }));
  });

});
