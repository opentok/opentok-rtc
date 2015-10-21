var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsController', function() {

  before(function() {
    document.body.innerHTML = window.__html__['test/unit/recordingsView_spec.html'];
  });

  describe('#init', function() {
    it('should exist', function() {
      expect(RecordingsController.init).to.exist;
    });

    it('should be initialized and listen for "archive" events',
        sinon.test(function(done) {
      this.stub(LazyLoader, 'dependencyLoad', function(resources) {
        return Promise.resolve();
      });

      this.stub(Modal, 'show', function() {
        done();
      });

      this.stub(RecordingsView, 'init', function() {
        Utils.sendEvent('archive', {
          id: 'id',
          action: 'delete'
        });
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
