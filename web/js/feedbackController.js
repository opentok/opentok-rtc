!function(global) {
  'use strict';

  var debug =
    new Utils.MultiLevelLogger('feedbackController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  var eventHandlers = {
    'sendFeedback': function(evt) {
      debug.log('feedbackView:sendFeedback', evt.detail);
      Request.sendFeedback(evt.detail);
    }
  };

  var init = function() {
    return LazyLoader.load([
      '/js/feedbackView.js'
    ]).then(function () {
      Utils.addEventsHandlers('feedbackView:', eventHandlers, global);
      FeedbackView.init();
    });
  };

  global.FeedbackController = {
    init: init
  };

}(this);
