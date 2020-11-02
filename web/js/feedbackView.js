/* global Modal */

!((global) => {
  let showFeedback; let sendButton; let audioScoreSelect; let videoScoreSelect; let otherInfo; let
    reportIssueScore;

  const feedbackReportSelector = '.feedback-report';

  function showForm() {
    resetForm();
    return Modal.show(feedbackReportSelector);
  }

  function hideForm() {
    return Modal.hide(feedbackReportSelector);
  }

  const init = (aReportIssueLevel) => {
    reportIssueScore = aReportIssueLevel;
    showFeedback = document.querySelector('#showFeedback');
    sendButton = document.querySelector('.feedback-report .send-feedback');
    audioScoreSelect = document.querySelector('.feedback-report .audio-score');
    videoScoreSelect = document.querySelector('.feedback-report .video-score');
    otherInfo = document.querySelector('.feedback-report .other-info');
    addHandlers();
  };

  const resetForm = () => {
    otherInfo.value = '';
  };

  const addHandlers = () => {
    sendButton.addEventListener('click', (event) => {
      event.preventDefault();
      const audioScore = audioScoreSelect.options[audioScoreSelect.selectedIndex].value;
      const videoScore = videoScoreSelect.options[videoScoreSelect.selectedIndex].value;
      Utils.sendEvent('feedbackView:sendFeedback', {
        audioScore,
        videoScore,
        description: otherInfo.value
      });

      if (audioScore <= reportIssueScore || videoScore <= reportIssueScore) {
        Utils.sendEvent('feedbackView:reportIssue');
      }

      hideForm();
    });

    showFeedback && showFeedback.addEventListener('click', (event) => {
      event.preventDefault();
      showForm();
    });
  };

  global.FeedbackView = {
    init
  };
})(this);
