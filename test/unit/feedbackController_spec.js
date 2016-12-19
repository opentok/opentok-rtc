var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FeedbackController', function() {

  var mockLazyLoader = null;

  before(function() {
    mockLazyLoader = window.LazyLoader;
    window.LazyLoader = { load: function() {} };
    sinon.stub(LazyLoader, 'load', function(resources) {
      return Promise.resolve();
    });
  });

  after(function() {
    LazyLoader.load.restore();
    window.LazyLoader = mockLazyLoader;
  });

  describe('#init', function() {
    it('should exist', function() {
      expect(FeedbackController.init).to.exist;
      expect(FeedbackController.init).to.be.a('function');
    });

    it('should be initialized', sinon.test(function(done) {
      this.stub(FeedbackView, 'init', function() {});

      FeedbackController.init().then(function() {
        expect(FeedbackView.init.called).to.be.true;
        done();
      });

    }));
  });

  describe('#feedbackView:sendFeedback event', function() {
    it('should send feedback event', sinon.test(function() {
      this.spy(Request, 'sendFeedback');

      window.dispatchEvent(new CustomEvent('feedbackView:sendFeedback'));
      expect(Request.sendFeedback.calledOnce).to.be.true;
    }));
  });
});
