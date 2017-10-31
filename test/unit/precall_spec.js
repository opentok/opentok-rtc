var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('PrecallView', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/roomView_spec.html'];
    window.document.body.innerHTML += window.__html__['test/unit/precallView_spec.html'];
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {
      return new Promise((resolve) => {
        resolve();
      });
    } };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    sinon.stub(ChatView, 'init', () => Promise.resolve());
    window.MockRoomStatus._install();
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(PrecallView).to.exist;
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(PrecallView.init).to.exist;
      expect(PrecallView.init).to.be.a('function');
    });

    it('should init the module', sinon.test(function () {
      this.stub(LayoutManager, 'init');
      PrecallView.init();
    }));
  });

  describe('#PrecallControllers', () => {
    it('should close the Precall view when the form is submitted', (done) => {
      var topBannerElem = document.getElementById('top-banner');
      var screenElem = document.getElementById('screen');
      expect(topBannerElem.style.visibility).to.equal('');
      expect(screenElem.style.visibility).to.equal('');
      expect(document.getElementById('pre-call-test-results').id).to.equal('pre-call-test-results');
      //  window.dispatchEvent(new CustomEvent('PrecallController:endPrecall'));
      // window._model = {};
      PrecallController.init().then(() => {
        PrecallController.showCallSettingsPrompt('roomName', 'userName', window.MockOTHelper).then(() => {
          document.querySelector('.user-name-modal button .room-name').click();
          expect(topBannerElem.style.visibility).to.equal('top-banner');
          expect(screenElem.style.visibility).to.equal('visible');
          done();
        });
      });
    });
  });
});
