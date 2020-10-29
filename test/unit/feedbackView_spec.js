var sinonTest = require('sinon-test');

var test = sinonTest(sinon);
sinon.test = test;

var { assert } = chai;
var { expect } = chai;
var should = chai.should();

describe('FeedbackView', () => {
  var showFeedback,
    sendButton,
    audioScore,
    videoScore,
    otherInfo;
  var reportLevel = 3;
  var fakeOTHelper = {
    session: {
      apiKey: '123456'
    }
  };

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/feedbackView_spec.html'];
    showFeedback = document.querySelector('#showFeedback');
    sendButton = document.querySelector('.feedback-report .send-feedback');
    audioScore = document.querySelector('.feedback-report .audio-score');
    videoScore = document.querySelector('.feedback-report .video-score');
    otherInfo = document.querySelector('.feedback-report .other-info');
    reportIssueButton = document.querySelector('.feedback-report .report-issue');
  });

  it('should exist', () => {
    expect(FeedbackView).to.exist;
  });

  describe('#init()', () => {
    it('should export an init function', () => {
      expect(FeedbackView.init).to.exist;
      expect(FeedbackView.init).to.be.a('function');
      FeedbackView.init(reportLevel);
      expect(otherInfo.value).to.equals('');
    });
  });

  describe('#feedback form', () => {
    it('should be shown when button is clicked', sinon.test(function () {
      this.spy(Modal, 'show');
      otherInfo.value = 'other info';
      showFeedback.click();
      expect(Modal.show.calledOnce).to.be.true;
      expect(otherInfo.value).to.equals('');
    }));

    it('should send sendFeedback and reportIssue events when send button is submitted', sinon.test(function () {
      this.spy(Modal, 'hide');
      this.stub(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      // Index starts at 0, scores start at 1 so setting index to reportLevel ensures
      // Score is higher than level which sends report.
      audioScore.selectedIndex = reportLevel;
      videoScore.selectedIndex = reportLevel;
      sendButton.click();

      expect(Utils.sendEvent.called).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:sendFeedback');
      expect(Utils.sendEvent.getCall(0).args[1]).to.be.deep.equal({
        audioScore: audioScore.options[audioScore.selectedIndex].value,
        videoScore: videoScore.options[videoScore.selectedIndex].value,
        description: otherInfo.value,
      });
      expect(Utils.sendEvent.getCall(1).args[0]).to.be.equal('feedbackView:reportIssue');
    }));

    it('should send reportIssue event when send button is submitted and audio score is less than reportLevel', sinon.test(function () {
      this.spy(Modal, 'hide');
      this.stub(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      audioScore.selectedIndex = reportLevel - 1;
      videoScore.selectedIndex = reportLevel;
      sendButton.click();
      expect(Modal.hide.calledOnce).to.be.true;

      expect(Utils.sendEvent.calledTwice).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:sendFeedback');
      expect(Utils.sendEvent.getCall(1).args[0]).to.be.equal('feedbackView:reportIssue');
    }));

    it('should send reportIssue event when send button is submitted and video score is less than reportLevel', sinon.test(function () {
      this.spy(Modal, 'hide');
      this.stub(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      audioScore.selectedIndex = reportLevel;
      videoScore.selectedIndex = reportLevel - 1;
      sendButton.click();
      expect(Modal.hide.calledOnce).to.be.true;

      expect(Utils.sendEvent.calledTwice).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:sendFeedback');
      expect(Utils.sendEvent.getCall(1).args[0]).to.be.equal('feedbackView:reportIssue');
    }));
  });
});
