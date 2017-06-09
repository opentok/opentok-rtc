var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsController', () => {
  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    document.body.innerHTML = window.__html__['test/unit/recordingsView_spec.html'];
  });

  after(() => {
    LazyLoader.dependencyLoad.restore();
  });

  describe('#init', () => {
    it('should exist', () => {
      expect(RecordingsController.init).to.exist;
    });

    it('should be initialized and listen for "archive" events',
        sinon.test(function (done) {
          this.stub(Modal, 'show', () => {
            done();
            return Promise.resolve();
          });

          this.stub(RecordingsView, 'init', () => {
            Utils.sendEvent('archive', {
              id: 'id',
              action: 'delete',
            });
          });
          this.stub(FirebaseModel, 'init', (valA, valB) => {
            expect(valA).to.be.equal('valueA');
            expect(valB).to.be.equal('valueB');
            var model = {};
            return Promise.resolve(model);
          });
          var enableArchiveManager = true;
          RecordingsController.init(enableArchiveManager, 'valueA', 'valueB');
        }));
  });
});
