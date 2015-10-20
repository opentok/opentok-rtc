!function(exports) {
  'use strict';

  var debug;

  var _views = {
    '/room/': {
      mainView: 'RoomController',
      dependencies: [
        'RoomController'
      ]
    },
    '/': {
      mainView: 'LandingController',
      dependencies: [
        'LandingController'
      ]
    }
  };

  function getView() {
    var pathViews = Object.keys(_views);
    var numViews = pathViews.length;
    var path = exports.document.location.pathname;
    for(var i = 0; i < numViews; i++) {
      if (path.startsWith(pathViews[i]) &&
        _views[pathViews[i]].
          dependencies.
          every(function(dependency) {
            return !!exports[dependency];
          })) {
        return exports[_views[pathViews[i]].mainView];
      }
    }
    return null;
  }

  function init() {
    debug = new Utils.MultiLevelLogger('rtcApp.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);
    debug.log('Initializing app');
    var view = getView();
    if (view) {
      view.init();
    } else {
      debug.error('Couldn\'t find a view for ' + exports.document.location.pathname);
    }
  };

  exports.RTCApp = {
    init: init
  };

}(this);


this.addEventListener('load', function startApp() {
  // Check that everything was loaded correctly, or just use LazyLoader here...
  LazyLoader.dependencyLoad([
    '/js/libs/browser_utils.js',
    '/shared/js/utils.js',
    '/js/helpers/requests.js',
    '/js/roomController.js',
    '/js/landingController.js'
  ]).then(function() {
    RTCApp.init();
  });

});
