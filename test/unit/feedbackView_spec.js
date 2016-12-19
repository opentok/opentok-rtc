var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('FeedbackView', function() {

  var showFeedback, sendButton, audioScore, videoScore, otherInfo;

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/feedbackView_spec.html'];
    showFeedback = document.querySelector('#showFeedback');
    sendButton = document.querySelector('.feedback-report .send-feedback');
    audioScore = document.querySelector('.feedback-report .audio-score');
    videoScore = document.querySelector('.feedback-report .video-score');
    otherInfo = document.querySelector('.feedback-report .other-info');
  });

  it('should exist', function() {
    expect(FeedbackView).to.exist;
  });

  describe('#init()', function() {
    it('should export an init function', function() {
      expect(FeedbackView.init).to.exist;
      expect(FeedbackView.init).to.be.a('function');
      FeedbackView.init();
      expect(otherInfo.value).to.equals('');
    });
  });

  describe('#feedback form', function() {
    it('should be shown when button is clicked', sinon.test(function() {
      this.spy(Modal, 'show');
      otherInfo.value = 'other info';
      showFeedback.click();
      expect(Modal.show.calledOnce).to.be.true;
      expect(otherInfo.value).to.equals('');
    }));

    it('should send event when it is submitted', sinon.test(function() {
      this.spy(Modal, 'hide');
      this.spy(Utils, 'sendEvent');

      otherInfo.value = 'further info';
      sendButton.click();

      expect(Modal.hide.calledOnce).to.be.true;
      expect(Utils.sendEvent.calledOnce).to.be.true;
      expect(Utils.sendEvent.getCall(0).args[0]).to.be.equal('feedbackView:sendFeedback');
      expect(Utils.sendEvent.getCall(0).args[1]).to.be.deep.equal({
        audioScore: audioScore.options[audioScore.selectedIndex].value,
        videoScore: videoScore.options[videoScore.selectedIndex].value,
        otherInfo: otherInfo.value
      });

    }));
  });

});
