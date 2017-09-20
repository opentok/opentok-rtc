var expect = chai.expect;

describe('ScreenShareView', () => {
  var shareErrors;
  var screenShareLink;
  var installSectionError;
  var txtSectionError;
  var extInstallationSuccessful;

  function getShareErrors() {
    return document.querySelector('.screen-modal');
  }

  function testMsgError(event, msgError, expectedResult, done) {
    ScreenShareView.init();

    var resolveShow;
    var showDone = new Promise((resolve, reject) => {
      resolveShow = resolve;
    });

    sinon.stub(Modal, 'show', (selector, fcCb) => {
      fcCb && fcCb();
      resolveShow();
      return showDone;
    });

    // DispatchEvent is synchronous by definition
    // https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent
    // and because of it this is a correct test algorithm
    // pretty, isn't it?
    window.dispatchEvent(event);

    showDone.then(() => {
      expect(shareErrors.dataset.screenSharingType).to.be.equal(expectedResult);

      var span = shareErrors.querySelector('.errorDescription');
      expect(span.textContent).to.be.equal(msgError);
      Modal.show.restore();
      done();
    });
  }

  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    window.MockOTHelper._install();
  });

  beforeEach(() => {
    window.document.body.innerHTML = window.__html__['test/unit/screenShareView_spec.html'];
    shareErrors = getShareErrors();
    screenShareLink = shareErrors.querySelector('a');
    installSectionError = shareErrors.querySelector('#screenShareErrorInstall');
    txtSectionError = shareErrors.querySelector('#screenShareErrorMsg');
    extInstallationSuccessful = shareErrors.querySelector('#extInstallationSuccessful');
  });

  after(() => {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', () => {
    expect(ScreenShareView).to.exist;
  });

  describe('#init', () => {
    it('should exist and be a function', () => {
      expect(ScreenShareView.init).to.exist;
      expect(ScreenShareView.init).to.be.a('function');
    });

    it('should initialized properly the object', () => {
      ScreenShareView.init();

      [installSectionError, txtSectionError, extInstallationSuccessful].forEach((elem) => {
        expect(elem).to.exist;
      });
    });
  });

  it('should show message when user denied access', (done) => {
    var err = {
      code: 1500,
      message: 'Access Denied',
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, err.message, 'error-sharing', done);
  });

  it('should show a message when has error and is not userDenied or extensionNotInstalled',
     (done) => {
       var err = {
         code: 'AAAA',
         message: 'whatEver Error',
       };

       var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

       testMsgError(event, err.message, 'error-sharing', done);
     });

  it('should show install message when error is extNotInstalled', (done) => {
    var err = {
      code: 'OT0001',
      message: 'Install extension',
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, '', 'error-installing', done);
  });

  it('should show installation success', (done) => {
    var err = {
      error: false,
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, '', 'successful-installation', done);
  });

  it('should show installation success', (done) => {
    var err = {
      error: true,
      message: 'Error message',
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, err.message, 'error-sharing', done);
  });

  it('should close the stream window once it has been destroyed', sinon.test(function (done) {
    ScreenShareView.init();

    this.stub(RoomView, 'deleteStreamView', (id) => {
      expect(id).to.be.equal('desktop');
      done();
    });

    var event = new CustomEvent('screenShareController:destroyed');
    window.dispatchEvent(event);
  }));
});
