/* global OT, FeedbackView */

!(function (global) {
  'use strict';

  var otHelper;

  var eventHandlers = {
    sendFeedback: function (evt) {
      var report = evt.detail;
      var loggedEvent = {
        action: 'SessionQuality',
        partnerId: otHelper.session.apiKey,
        sessionId: otHelper.session.id,
        connectionId: otHelper.session.connection.id,
        publisherId: otHelper.publisherId,
        audioScore: report.audioScore,
        videoScore: report.videoScore,
        description: report.description,
        clientSystemTime: new Date().getTime(),
        source: document.location.href
      };
      var xhr = new XMLHttpRequest();
      var url = window.feedbackUrl;
      xhr.open('POST', url, true);
      xhr.send(JSON.stringify(loggedEvent));
    },
    reportIssue: function () {
      var loggedEvent = {
        action: 'ReportIssue',
        partnerId: otHelper.session.apiKey,
        sessionId: otHelper.session.id,
        connectionId: otHelper.session.connection.id,
        publisherId: otHelper.publisherId
      };
      OT.reportIssue(function (error, reportId) {
        if (!error) {
          loggedEvent.reportIssueId = reportId;
        }
      });
    }
  };

  var init = function (aOTHelper, aReportIssueLevel) {
    return LazyLoader.load([
      '/js/feedbackView.js'
    ]).then(function () {
      otHelper = aOTHelper;
      Utils.addEventsHandlers('feedbackView:', eventHandlers, global);
      FeedbackView.init(aReportIssueLevel);
    });
  };

  global.FeedbackController = {
    init: init
  };
}(this));
