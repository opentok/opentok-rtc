var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('PrecallController', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/precallView_spec.html'];
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {
      return new Promise((resolve) => {
        resolve();
      });
    } };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    sinon.stub(ChatView, 'init', () => Promise.resolve());
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(PrecallController).to.exist;
  });

  describe('#init()', () => {
    it('should export an init function', () => {
      expect(PrecallController.init).to.exist;
      expect(PrecallController.init).to.be.a('function');
    });

    it('should init the module', sinon.test(function () {
      this.stub(LayoutManager, 'init');
      PrecallController.init();
    }));
  });

  describe('#showCallSettingsPrompt()', () => {
    it('should export a showCallSettingsPrompt function', () => {
      expect(PrecallController.showCallSettingsPrompt).to.exist;
      expect(PrecallController.showCallSettingsPrompt).to.be.a('function');
    });
  });
});
