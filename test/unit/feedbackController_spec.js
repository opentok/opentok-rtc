var sinonTest = require('sinon-test');

var test = sinonTest(sinon);
sinon.test = test;
var { assert } = chai;
var { expect } = chai;
var should = chai.should();

describe('FeedbackController', () => {
  var realLazyLoader = null;
  var realOT = null;
  var fakeOTHelper = {
    session: {
      applicationId: '123456',
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
    sinon.stub(LazyLoader, 'load').callsFake((resources) => Promise.resolve());
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
      this.stub(FeedbackView, 'init').callsFake(() => {});

      FeedbackController.init(fakeOTHelper).then(() => {
        expect(FeedbackView.init.called).to.be.true;
        done();
      });
    }));
  });

  // Fix
  describe('#feedbackView:sendFeedback event', () => {
    it('should send feedback event', sinon.test(function () {
      var xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];
      var report = {
        audioScore: 1,
        videoScore: 2,
        description: 'description',
      };
      var timestamp = new Date().getTime();
      var sourceUrl = document.location.href;

      xhr.onCreate = function (xhr) {
        requests.push(xhr);
      };

      var expectedRequestBody = {
        action: 'SessionQuality',
        partnerId: fakeOTHelper.session.applicationId,
        sessionId: fakeOTHelper.session.id,
        connectionId: fakeOTHelper.session.connection.id,
        publisherId: fakeOTHelper.publisherId,
        clientSystemTime: timestamp,
        source: sourceUrl,
        audioScore: report.audioScore,
        videoScore: report.videoScore,
        description: report.description,
      };

      window.dispatchEvent(new CustomEvent('feedbackView:sendFeedback', { detail: report }));
      expect(requests.length).to.equal(1);
      expect(requests[0].method).to.equal('POST');
      var requestBodyObj = JSON.parse(requests[0].requestBody);
      expect(requestBodyObj.action).to.equal('SessionQuality');
      expect(requestBodyObj.partnerId).to.equal(fakeOTHelper.session.applicationId);
      expect(requestBodyObj.sessionId).to.equal(fakeOTHelper.session.id);
      expect(requestBodyObj.connectionId).to.equal(fakeOTHelper.session.connection.id);
      expect(requestBodyObj.publisherId).to.equal(fakeOTHelper.publisherId);
      expect(requestBodyObj.clientSystemTime).to.equal(timestamp);
      expect(requestBodyObj.source).to.equal(sourceUrl);
      expect(requestBodyObj.audioScore).to.equal(report.audioScore);
      expect(requestBodyObj.videoScore).to.equal(report.videoScore);
      expect(requestBodyObj.description).to.equal(report.description);
      xhr.restore();
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
