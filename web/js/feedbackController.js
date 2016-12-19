!function(global) {
  'use strict';

  var debug =
    new Utils.MultiLevelLogger('feedbackController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);
  var otHelper;

  var eventHandlers = {
    'sendFeedback': function(evt) {
      var report = evt.detail;
      var loggedEvent = {
        action: 'SessionQuality',
        sessionId: otHelper.session.id,
        connectionId: otHelper.session.connection.id,
        publisherId: otHelper.publisherId,
        audioScore: report.audioScore,
        videoScore: report.videoScore,
        description: report.description
      };
      debug.log('feedbackView:sendFeedback', loggedEvent);
      OT.analytics.logEvent(loggedEvent);
    }
  };

  var init = function(aOTHelper) {
    return LazyLoader.load([
      '/js/feedbackView.js'
    ]).then(function () {
      otHelper = aOTHelper;
      Utils.addEventsHandlers('feedbackView:', eventHandlers, global);
      FeedbackView.init();
    });
  };

  global.FeedbackController = {
    init: init
  };

}(this);
