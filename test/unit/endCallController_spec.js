var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('EndCallController', () => {
  before(() => {
    window.LazyLoader = window.LazyLoader || { dependencyLoad() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', resources => Promise.resolve());
    window.MockOTHelper._install();
  });

  after(() => {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  describe('#init', () => {
    it('should exist', () => {
      expect(EndCallController.init).to.exist;
      expect(EndCallController.init).to.be.a('function');
    });

    it('should be initialized', sinon.test(function (done) {
      this.stub(EndCallView, 'init', () => {});

      EndCallController.init({}).then(() => {
        expect(EndCallView.init.called).to.be.true;
        done();
      });
    }));
  });

  describe('#roomView:endCall event', () => {
    it('should send endCall event', sinon.test(function () {
      this.spy(Utils, 'sendEvent');

      window.dispatchEvent(new CustomEvent('roomView:endCall'));
      expect(Utils.sendEvent.calledOnce).to.be.true;
    }));
  });
});
