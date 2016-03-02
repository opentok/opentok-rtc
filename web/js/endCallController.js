!function(exports) {
  'use strict';

  var endCall = function() {
    OTHelper.disconnectFromSession();
    Utils.sendEvent('EndCallController:endCall');
  };

  var eventHandlers = {
    'roomView:endCall': endCall
  };

  var init = function(model) {
    return LazyLoader.dependencyLoad([
      '/js/vendor/ejs_production.js',
      '/js/endCallView.js'
    ]).then(function() {
      EndCallView.init(model);
      Utils.addEventsHandlers('', eventHandlers);
    });
  };

  exports.EndCallController = {
    init: init
  };

}(this);
