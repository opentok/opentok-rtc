var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('EndCallController', function() {

  before(function() {
    window.LazyLoader = window.LazyLoader || { dependencyLoad: function() {} };
    sinon.stub(LazyLoader, 'dependencyLoad', function(resources) {
      return Promise.resolve();
    });
    window.MockOTHelper._install();
  });

  after(function() {
    window.MockOTHelper._restore();
    LazyLoader.dependencyLoad.restore();
  });

  describe('#init', function() {
    it('should exist', function() {
      expect(EndCallController.init).to.exist;
      expect(EndCallController.init).to.be.a('function');
    });

    it('should be initialized', sinon.test(function(done) {
      this.stub(EndCallView, 'init', function() {});

      EndCallController.init({}).then(function() {
        expect(EndCallView.init.called).to.be.true;
        done();
      });

    }));
  });

  describe('#roomView:endCall event', function() {
    it('should send endCall event', sinon.test(function() {
      this.spy(Utils, 'sendEvent');

      window.dispatchEvent(new CustomEvent('roomView:endCall'));
      expect(Utils.sendEvent.calledOnce).to.be.true;
    }));
  });
});
