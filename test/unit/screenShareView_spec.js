var expect = chai.expect;

describe('ScreenShareView', function() {

  var container;
  var shareErrors;
  var screenShareLink;
  var installSectionError;
  var txtSectionError;
  var extInstallationSuccessful;

  function getContainer() {
    return document.querySelector('.desktop');
  }

  function getShareErrors() {
    return document.querySelector('.screen-modal');
  }

  function testMsgError(event, msgError, expectedResults) {
    ScreenShareView.init();

    // DispatchEvent is synchronous by definition
    // https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent
    // and because of it this is a correct test algorithm
    // pretty, isn't it?
    window.dispatchEvent(event);

    expectedResults.forEach(function(result) {
      expect(result.elem.classList.contains('visible')).to.be.equal(result.value);
    });

    expect(container.children.length).to.equal(0);
    var span = shareErrors.querySelector('.errTxt');
    expect(span.textContent).to.be.equal(msgError);
  }

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });
    window.MockOTHelper._install();
    sinon.stub(Modal, 'show', function() {
      return Promise.resolve();
    });
  });

  beforeEach(function() {
    window.document.body.innerHTML = window.__html__['test/unit/screenShareView_spec.html'];
    container = getContainer();
    shareErrors = getShareErrors();
    screenShareLink = shareErrors.querySelector('a');
    installSectionError = shareErrors.querySelector('#screenShareErrorInstall');
    txtSectionError = shareErrors.querySelector('#screenShareErrorMsg');
    extInstallationSuccessful = shareErrors.querySelector('#extInstallationSuccessful');
  });

  after(function() {
    Modal.show.restore();
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
        expect(elem.classList.contains('visible')).to.be.false;
      });
    });
  });

  it('should show message when user denied access', function() {
    var err = {
      code: 1500,
      message: 'Access Denied'
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, err.message, [
      { elem: installSectionError, value: false },
      { elem: txtSectionError, value: true },
      { elem: extInstallationSuccessful, value: false }
    ]);
  });

  it('should show a message when has error and is not userDenied or extensionNotInstalled',
     function() {
     var err = {
       code: 'AAAA',
       message: 'whatEver Error'
     };

     var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

     testMsgError(event, 'Error sharing screen. ' + err.message, [
      { elem: installSectionError, value: false },
      { elem: txtSectionError, value: true },
      { elem: extInstallationSuccessful, value: false }
     ]);
  });

  it('should show install message when error is extNotInstalled', function() {
    var err = {
      code: 'OT0001',
      message: 'Install extension'
    };

    var event = new CustomEvent('screenShareController:shareScreenError', { detail: err });

    testMsgError(event, '', [
      { elem: installSectionError, value: true },
      { elem: txtSectionError, value: false },
      { elem: extInstallationSuccessful, value: false }
    ]);
  });

  it('should show installation success', function() {
    var err = {
      error: false
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, '', [
      { elem: installSectionError, value: false },
      { elem: txtSectionError, value: false },
      { elem: extInstallationSuccessful, value: true }
    ]);
  });

  it('should show installation success', function() {
    var err = {
      error: true,
      message: 'Error message'
    };

    var event = new CustomEvent('screenShareController:extInstallationResult', { detail: err });

    testMsgError(event, 'Error installation extension. ' + err.message, [
      { elem: installSectionError, value: false },
      { elem: txtSectionError, value: true },
      { elem: extInstallationSuccessful, value: false }
    ]);
  });

});
