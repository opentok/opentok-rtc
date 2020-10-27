var { assert } = chai;
var { expect } = chai;
var should = chai.should();

describe('PrecallController', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/precallView_spec.html'];
    window.LazyLoader = window.LazyLoader || {
      dependencyLoad() {
        return new Promise((resolve) => {
          resolve();
        });
      }
    };
    sinon.stub(LazyLoader, 'dependencyLoad', (resources) => Promise.resolve());
    sinon.stub(ChatView, 'init', () => Promise.resolve());
    sinon.stub(Modal, 'show', (selector, fcCb) => new Promise((resolve) => {
      var modal = document.querySelector(selector);
      modal.classList.add('visible');
      modal.classList.add('show');
      fcCb && fcCb();
      resolve();
    }));
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
    Modal.show.restore();
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

    it('should display the call settings', sinon.test((done) => {
      const callSettingsElem = document.querySelector('.user-name-modal');
      const otHelper = new window.MockOTHelper({});
      PrecallController.init();
      PrecallController.showCallSettingsPrompt('roomName', 'username', otHelper);
      otHelper.otLoaded.then(() => {
        expect(callSettingsElem.classList.contains('visible')).to.be.true;
        done();
      });
    }));

    it('should hide call settings on Enter keypress', sinon.test(function (done) {
      this.stub(PrecallView, 'hide', () => {
        PrecallView.hide.restore();
        done();
      });
      const callSettingsElem = document.querySelector('.user-name-modal');
      const otHelper = new window.MockOTHelper({});
      PrecallController.init();
      PrecallController.showCallSettingsPrompt('roomName', 'username', otHelper);
      otHelper.otLoaded.then(() => {
        const keypressEvent = document.createEvent('Event');
        keypressEvent.which = 13;
        keypressEvent.initEvent('keypress', true);
        document.getElementById('user-name-input').dispatchEvent(keypressEvent);
      });
    }));
  });
});
