/* global Modal */

!(function (global) {
  'use strict';

  var showFeedback,
    sendButton,
    audioScoreSelect,
    videoScoreSelect,
    otherInfo,
    reportIssueScore;

  var feedbackReportSelector = '.feedback-report';

  function showForm() {
    resetForm();
    return Modal.show(feedbackReportSelector);
  }

  function hideForm() {
    return Modal.hide(feedbackReportSelector);
  }

  var init = function (aReportIssueLevel) {
    reportIssueScore = aReportIssueLevel;
    showFeedback = document.querySelector('#showFeedback');
    sendButton = document.querySelector('.feedback-report .send-feedback');
    audioScoreSelect = document.querySelector('.feedback-report .audio-score');
    videoScoreSelect = document.querySelector('.feedback-report .video-score');
    otherInfo = document.querySelector('.feedback-report .other-info');
    addHandlers();
  };

  var resetForm = function () {
    otherInfo.value = '';
  };

  var addHandlers = function () {
    sendButton.addEventListener('click', function (event) {
      event.preventDefault();
      var audioScore = audioScoreSelect.options[audioScoreSelect.selectedIndex].value;
      var videoScore = videoScoreSelect.options[videoScoreSelect.selectedIndex].value;
      Utils.sendEvent('feedbackView:sendFeedback', {
        audioScore: audioScore,
        videoScore: videoScore,
        description: otherInfo.value
      });

      if (audioScore <= reportIssueScore || videoScore <= reportIssueScore) {
        Utils.sendEvent('feedbackView:reportIssue');
      }

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
