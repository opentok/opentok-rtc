var expect = chai.expect;

describe('ScreenShareView', function() {

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
    var showDone = new Promise(function(resolve, reject) {
      resolveShow = resolve;
    });

    sinon.stub(Modal, 'show', function(selector, fcCb) {
      fcCb && fcCb();
      resolveShow();
      return showDone;
    });

    // DispatchEvent is synchronous by definition
    // https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent
    // and because of it this is a correct test algorithm
    // pretty, isn't it?
    window.dispatchEvent(event);

    showDone.then(function() {
      expect(shareErrors.dataset.screenSharingType).to.be.equal(expectedResult);

      var span = shareErrors.querySelector('.errorDescription');
      expect(span.textContent).to.be.equal(msgError);
      Modal.show.restore();
      done();
    });
  }

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });
    window.MockOTHelper._install();
  });

  beforeEach(function() {
    window.document.body.innerHTML = window.__html__['test/unit/screenShareView_spec.html'];
    shareErrors = getShareErrors();
    screenShareLink = shareErrors.querySelector('a');
    installSectionError = shareErrors.querySelector('#screenShareErrorInstall');
    txtSectionError = shareErrors.querySelector('#screenShareErrorMsg');
    extInstallationSuccessful = shareErrors.querySelector('#extInstallationSuccessful');
  });

  after(function() {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', function() {
    expect(ScreenShareView).to.exist;
  });

  describe('#init', function() {
    it('should exist and be a function', function() {
      expect(ScreenShareView.init).to.exist;
      expect(ScreenShareView.init).to.be.a('function');
    });

    it('should initialized properly the object', function() {
      ScreenShareView.init();

      [installSectionError, txtSectionError, extInstallationSuccessful].forEach(function(elem) {
        expect(elem).to.exist;
      });
    });
  });

  it('should show message when user denied access', function(done) {
    var err = {
      code: 1500,
      message: 'Access Denied'
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, err.message, 'error-sharing', done);
  });

  it('should show a message when has error and is not userDenied or extensionNotInstalled',
     function(done) {
     var err = {
       code: 'AAAA',
       message: 'whatEver Error'
     };

     var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

     testMsgError(event, err.message, 'error-sharing', done);
  });

  it('should show install message when error is extNotInstalled', function(done) {
    var err = {
      code: 'OT0001',
      message: 'Install extension'
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, '', 'error-installing', done);
  });

  it('should show installation success', function(done) {
    var err = {
      error: false
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, '', 'successful-installation', done);
  });

  it('should show installation success', function(done) {
    var err = {
      error: true,
      message: 'Error message'
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, err.message, 'error-sharing', done);
  });

  it('should close the stream window once it has been destroyed', sinon.test(function(done) {
    ScreenShareView.init();

    this.stub(RoomView, 'deleteStreamView', function(id) {
      expect(id).to.be.equal('desktop');
      done();
    });

    var event = new CustomEvent('screenShareController:destroyed');
    window.dispatchEvent(event);
  }));

});
