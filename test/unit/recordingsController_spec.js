var { assert } = chai;
var { expect } = chai;
var should = chai.should();

describe('RecordingsController', () => {
  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad').callsFake((resources) => Promise.resolve());
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
        this.stub(Modal, 'show').callsFake(() => {
          done();
          return Promise.resolve();
        });

        this.stub(RecordingsView, 'init').callsFake(() => {
          Utils.sendEvent('archive', {
            id: 'id',
            action: 'delete',
          });
        });
        var enableArchiveManager = true;
        RecordingsController.init(enableArchiveManager);
      }));
  });
});
