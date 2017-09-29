var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FeedbackController', () => {
  var realLazyLoader = null;
  var realOT = null;
  var fakeOTHelper = {
    session: {
      apiKey: '123456',
      id: 'abcd1234',
      connection: {
        id: 'connectionIdID',
      },
    },
    publisherId: 'somePublisherId',
  };

  before(() => {
    realLazyLoader = window.LazyLoader;
    window.LazyLoader = { load() {} };
    realOT = window.OT;
    window.OT = {
      reportIssue() {},
      analytics: {
        logEvent() {},
      },
    };
    sinon.stub(LazyLoader, 'load', resources => Promise.resolve());
  });

  after(() => {
    window.LazyLoader.load.restore();
    window.LazyLoader = realLazyLoader;
    window.OT = realOT;
  });

  describe('#init', () => {
    it('should exist', () => {
      expect(FeedbackController.init).to.exist;
      expect(FeedbackController.init).to.be.a('function');
    });

    it('should be initialized', sinon.test(function (done) {
      this.stub(FeedbackView, 'init', () => {});

      FeedbackController.init(fakeOTHelper).then(() => {
        expect(FeedbackView.init.called).to.be.true;
        done();
      });
    }));
  });

  describe('#feedbackView:sendFeedback event', () => {
    it('should send feedback event', sinon.test(function () {
      var logEventStub = this.stub(window.OT.analytics, 'logEvent', (aLoggedEvent) => {});
      var report = {
        audioScore: 1,
        videoScore: 2,
        description: 'description',
      };
      window.dispatchEvent(new CustomEvent('feedbackView:sendFeedback', { detail: report }));
      expect(logEventStub.calledOnce).to.be.true;
      expect(logEventStub.calledWith({
        action: 'SessionQuality',
        partnerId: fakeOTHelper.session.apiKey,
        sessionId: fakeOTHelper.session.id,
        connectionId: fakeOTHelper.session.connection.id,
        publisherId: fakeOTHelper.publisherId,
        audioScore: report.audioScore,
        videoScore: report.videoScore,
        description: report.description,
      })).to.be.true;
    }));
  });

  describe('#feedbackView:reportIssue event', () => {
    it('should send reportIssue event', sinon.test(() => {
      var reportIssueStub = sinon.stub(window.OT, 'reportIssue');
      window.dispatchEvent(new CustomEvent('feedbackView:reportIssue'));
      expect(reportIssueStub.calledOnce).to.be.true;
    }));
  });
});
