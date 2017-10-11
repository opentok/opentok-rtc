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
        description: report.description
      };
      OT.analytics.logEvent(loggedEvent);
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
