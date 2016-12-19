var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FeedbackController', function() {

  var realLazyLoader = null;
  var realOT = null;
  var fakeOTHelper = {
    session: {
      id: 'abcd1234',
      connection: {
        id: 'connectionIdID'
      }
    },
    publisherId: 'somePublisherId'
  };

  before(function() {
    realLazyLoader = window.LazyLoader;
    window.LazyLoader = { load: function() {} };
    realOT = window.OT;
    window.OT = {
      analytics: {
        logEvent: function() {}
      }
    };
    sinon.stub(LazyLoader, 'load', function(resources) {
      return Promise.resolve();
    });
  });

  after(function() {
    window.LazyLoader.load.restore();
    window.LazyLoader = realLazyLoader;
    window.OT = realOT;
  });

  describe('#init', function() {
    it('should exist', function() {
      expect(FeedbackController.init).to.exist;
      expect(FeedbackController.init).to.be.a('function');
    });

    it('should be initialized', sinon.test(function(done) {
      this.stub(FeedbackView, 'init', function() {});

      FeedbackController.init(fakeOTHelper).then(function() {
        expect(FeedbackView.init.called).to.be.true;
        done();
      });

    }));
  });

  describe('#feedbackView:sendFeedback event', function() {
    it('should send feedback event', sinon.test(function() {

      var logEventStub = this.stub(window.OT.analytics, 'logEvent', function(aLoggedEvent) {});
      var report = {
        audioScore: 1,
        videoScore: 2,
        description: 'description'
      };
      window.dispatchEvent(new CustomEvent('feedbackView:sendFeedback', { detail : report }));
      expect(logEventStub.calledOnce).to.be.true;
      expect(logEventStub.calledWith({
        action: 'SessionQuality',
        sessionId: fakeOTHelper.session.id,
        connectionId: fakeOTHelper.session.connection.id,
        publisherId: fakeOTHelper.publisherId,
        audioScore: report.audioScore,
        videoScore: report.videoScore,
        description: report.description
      })).to.be.true;

    }));
  });
});
