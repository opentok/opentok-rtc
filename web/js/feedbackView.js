!(function(global) {
  'use strict';

  var showFeedback,
    sendButton,
    audioScore,
    videoScore,
    otherInfo,
    reportButton;

  var feedbackReportSelector = '.feedback-report';

  function showForm() {
    resetForm();
    return Modal.show(feedbackReportSelector);
  }

  function hideForm() {
    return Modal.hide(feedbackReportSelector);
  }

  var init = function() {
    showFeedback = document.querySelector('#showFeedback');
    sendButton = document.querySelector('.feedback-report .send-feedback');
    audioScore = document.querySelector('.feedback-report .audio-score');
    videoScore = document.querySelector('.feedback-report .video-score');
    otherInfo = document.querySelector('.feedback-report .other-info');
    reportButton = document.querySelector('.feedback-report .report-issue');
    addHandlers();
  };

  var resetForm = function() {
    otherInfo.value = '';
  };

  var addHandlers = function() {
    sendButton.addEventListener('click', function(event) {
      event.preventDefault();

      Utils.sendEvent('feedbackView:sendFeedback', {
        audioScore: audioScore.options[audioScore.selectedIndex].value,
        videoScore: videoScore.options[videoScore.selectedIndex].value,
        description: otherInfo.value
      });

      hideForm();
    });

    reportButton.addEventListener('click', function(event) {
      event.preventDefault();

      Utils.sendEvent('feedbackView:reportIssue');

      hideForm();
    });

    showFeedback && showFeedback.addEventListener('click', function onShowFeedbackClicked(event) {
      event.preventDefault();
      showForm();
    });
  };

  global.FeedbackView = {
    init: init
  };
}(this));
