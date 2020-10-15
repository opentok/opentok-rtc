/* global OT, FeedbackView */

!(global => {
  let otHelper;

  const eventHandlers = {
    sendFeedback(evt) {
      const report = evt.detail;
      const loggedEvent = {
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
      const xhr = new XMLHttpRequest();
      const url = window.feedbackUrl;
      xhr.open('POST', url, true);
      xhr.send(JSON.stringify(loggedEvent));
    },
    reportIssue() {
      const loggedEvent = {
        action: 'ReportIssue',
        partnerId: otHelper.session.apiKey,
        sessionId: otHelper.session.id,
        connectionId: otHelper.session.connection.id,
        publisherId: otHelper.publisherId
      };
      OT.reportIssue((error, reportId) => {
        if (!error) {
          loggedEvent.reportIssueId = reportId;
        }
      });
    }
  };

  const init = (aOTHelper, aReportIssueLevel) => {
    return LazyLoader.load([
      '/js/feedbackView.js'
    ]).then(() => {
      otHelper = aOTHelper;
      Utils.addEventsHandlers('feedbackView:', eventHandlers, global);
      FeedbackView.init(aReportIssueLevel);
    });
  };

  global.FeedbackController = {
    init
  };
})(this);
