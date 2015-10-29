var expect = chai.expect;

describe('ScreenShareController', function() {

  var chromeExtId = 'querty';
  var realChrome = null;

  var mockChrome = {
    isGoingToWork: true,
    error: 'not installed',
    webstore: {
      install: function(url, fcOk, fcError) {
        mockChrome.isGoingToWork && fcOk() || fcError(mockChrome.error);
      }
    }
  };

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };

    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });

    window.MockOTHelper._install();

    sinon.stub(ScreenShareView, 'init', function() {});

    realChrome = window.chrome || null;
    window.chrome = mockChrome;
  });

  after(function() {
    window.chrome = realChrome;
    ScreenShareView.init.restore();
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  it('should exist', function() {
    expect(ScreenShareController).to.exist;
  });

  describe('#init', function() {
    it('should exist and be a function', function() {
      expect(ScreenShareController.init).to.exist;
      expect(ScreenShareController.init).to.be.a('function');
    });
  });

  it('should initialized properly the object and return chromeExtId', function(done) {
    ScreenShareController.init('usr', chromeExtId).then(function() {
      expect(ScreenShareController.chromeExtId).to.be.equal(chromeExtId);
      done();
    });
  });

  it('should start sharing the screen when roomView:shareScreen is received and shared works',
     sinon.test(function(done) {

    var event = new CustomEvent('roomView:shareScreen');
    OTHelper.isGoingToWork = true;
    this.spy(OTHelper, 'shareScreen');

    window.addEventListener('screenShareController:changeScreenShareStatus',
                            function handlerTest(evt) {
      window.removeEventListener('screenShareController:changeScreenShareStatus', handlerTest);
      expect(evt.detail.isSharing).to.be.true;
      expect(OTHelper.shareScreen.calledOnce).to.be.true;
      done();
    });

    ScreenShareController.init('usr', chromeExtId).then(function() {
      window.dispatchEvent(event);
    });
  }));

  it('should stop sharing the screen when the second roomView:shareScreen is received',
     sinon.test(function() {

    var event = new CustomEvent('roomView:shareScreen');
    OTHelper.isGoingToWork = true;
    this.spy(OTHelper, 'stopShareScreen');

    window.dispatchEvent(event);

    expect(OTHelper.stopShareScreen.calledOnce).to.be.true;
  }));

  it('should respond correctly when roomView:shareScreen is received and sharing does not work',
     sinon.test(function(done) {

   var event = new CustomEvent('roomView:shareScreen');
   OTHelper.isGoingToWork = false;
   this.spy(OTHelper, 'shareScreen');

   window.addEventListener('screenShareController:shareScreenError', function handlerTest(evt) {
      window.removeEventListener('screenShareController:shareScreenError', handlerTest);
      expect(evt.detail).to.be.deep.equal(OTHelper.error);
      expect(OTHelper.shareScreen.calledOnce).to.be.true;
      done();
    });

    ScreenShareController.init('usr', chromeExtId).then(function() {
      window.dispatchEvent(event);
    });
  }));

  it('should respond correctly to screenShareView:installExtension when ' +
     'installation works', function(done) {

     var event = new CustomEvent('screenShareView:installExtension');
     window.chrome.isGoingToWork = true;

     window.addEventListener('screenShareController:extInstallationResult',
                             function handlerTest(evt) {
       window.removeEventListener('screenShareController:extInstallationResult', handlerTest);
       expect(evt.detail.error).to.be.false;
       done();
     });

     ScreenShareController.init('usr', chromeExtId).then(function() {
       window.dispatchEvent(event);
     });
  });

  it('should respond correctly to screenShareView:installExtension when ' +
     'installation does not work', function(done) {
    var event = new CustomEvent('screenShareView:installExtension');
    window.chrome.isGoingToWork = false;

    window.addEventListener('screenShareController:extInstallationResult',
                            function handlerTest(evt) {
      window.removeEventListener('screenShareController:extInstallationResult', handlerTest);
      expect(evt.detail.error).to.be.true;
      expect(evt.detail.message).to.be.equal(window.chrome.error);
      done();
    });

    ScreenShareController.init('usr', chromeExtId).then(function() {
      window.dispatchEvent(event);
    });
  });
});
