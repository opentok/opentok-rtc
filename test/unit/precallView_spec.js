var { assert } = chai;
var { expect } = chai;
var should = chai.should();
var sandbox = sinon.createSandbox();
describe('PrecallView', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/precallView_spec.html'];
  });

  it('should exist', () => {
    expect(PrecallView).to.exist;
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(PrecallView.init).to.exist;
      expect(PrecallView.init).to.be.a('function');
    });

    it('should init the module', (() => {
      sandbox.stub(LayoutManager, 'init');
      PrecallView.init();
      sandbox.restore();
    }));
  });

  describe('#hide()', () => {
    it('should hide the video preview', () => {
      expect(document.getElementById('video-preview').style.visibility).to.equal('');
      PrecallView.hide();
      expect(document.getElementById('video-preview').style.visibility).to.equal('hidden');
    });
  });

  describe('#setRoomName()', () => {
    it('should set the room name', () => {
      PrecallView.setRoomName('roomName');
      expect(document.querySelector('.user-name-modal button .room-name')
        .textContent).to.equal('Join roomName');
      expect(document.getElementById('name-heading').textContent).to.equal('roomName');
    });
  });
  describe('#setUsername()', () => {
    it('should set the user name in the video preview', () => {
      PrecallView.setUsername('user name foo');
      expect(document.getElementById('video-preview-name').textContent).to.equal('user name foo');
    });
  });
  describe('#setVolumeMeterLevel()', () => {
    it('should set the volume level meter element\'s width', () => {
      const level = 0.1234;
      PrecallView.setVolumeMeterLevel(level);
      expect(document.getElementById('audio-meter-level').style.width).to.equal((level * 89) + 'px');
    });
  });
  describe('#displayNetworkTestResults()', () => {
    it('should display the network test results', () => {
      PrecallView.displayNetworkTestResults({
        bitsPerSecond: 4,
        audio: { },
        video: { },
      });
      expect(document.getElementById('connectivity-cancel').style.display).to.equal('none');
      expect(document.getElementById('pre-call-test-results').style.display).to.equal('block');
    });
  });
  describe('#hideConnectivityTest()', () => {
    it('should hide the connectivity test elements', () => {
      PrecallView.hideConnectivityTest();
      expect(document.getElementById('pre-call-test').style.display).to.equal('none');
      expect(document.getElementById('precall-test-meter').style.display).to.equal('none');
    });
  });
});
