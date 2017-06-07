!(function(exports) {
  'use strict';

  var endCall = function() {
    Utils.sendEvent('EndCallController:endCall');
  };

  var eventHandlers = {
    'roomView:endCall': endCall
  };

  var init = function(model, sessionId) {
    return LazyLoader.dependencyLoad([
      '/js/vendor/ejs_production.js',
      '/js/endCallView.js'
    ]).then(function() {
      EndCallView.init(model, sessionId);
      Utils.addEventsHandlers('', eventHandlers);
    });
  };

  exports.EndCallController = {
    init: init
  };
}(this));
