var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FeedbackView', () => {
  var showFeedback,
    sendButton,
    audioScore,
    videoScore,
    otherInfo;
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
      FeedbackView.init(fakeOTHelper);
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

    it('should send event when send button is submitted', sinon.test(function () {
      this.spy(Modal, 'hide');
      this.stub(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      sendButton.click();

      expect(Modal.hide.calledOnce).to.be.true;

      expect(Utils.sendEvent.calledOnce).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:sendFeedback');
      expect(Utils.sendEvent.getCall(0).args[1]).to.be.deep.equal({
        audioScore: audioScore.options[audioScore.selectedIndex].value,
        videoScore: videoScore.options[videoScore.selectedIndex].value,
        description: otherInfo.value,
      });
    }));

    it('should send event when reportIssue button is submitted', sinon.test(function () {
      this.spy(Modal, 'hide');
      this.stub(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      reportIssueButton.click();

      expect(Modal.hide.calledOnce).to.be.true;

      expect(Utils.sendEvent.calledOnce).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:reportIssue');
    }));
  });
});
