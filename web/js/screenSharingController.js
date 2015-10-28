!function(globals) {
  'use strict';

  var debug;
  var _chromeExtId;
  var _isSharing;
  var _userName;
  var NAME_SUFFIX = '\'s screen';
  var DEFAULT_NAME = 'Unknown';

  var screenPublisherOptions = {
    name: 'screen',
    showControls: false,
    style: {
      nameDisplayMode: 'off'
    },
    publishAudio: false,
    videoSource: 'screen',
    insertMode: 'append'
  };

  var viewEventHandlers = {
    'sharingScreen': function(evt) {
      if (_isSharing) {
        OTHelper.stopSharingScreen();
        _isSharing = !_isSharing;
        RoomController.setScreenSharingStatus({ isSharing: _isSharing });
      } else {
        OTHelper.shareScreen(ScreenSharingView.desktopId, screenPublisherOptions).
          then(function() {
            _isSharing = !_isSharing;
            RoomController.setScreenSharingStatus({ isSharing: _isSharing });
          }).
          catch(function(error) {
            Utils.sendEvent('screenSharingController:sharingScreenError');
            error.hasError = true;
            RoomController.setScreenSharingStatus(error);
          });
      }
    },
    'installExtension': function(evt) {
      // TODO Replace logs with the correct user notification when the extension is implemented
      try {
        chrome.webstore.install('https://chrome.google.com/webstore/detail/' + _chromeExtId,
          function() {
            debug.log('successfully installed');
          }, function() {
            debug.error('failed to install', arguments);
          });
      } catch(e) {
        // It should not ever happen if the correct extensionId is set
        debug.error('Error installing extension:', e);
      }
    }
  };

  function init(aUserName, aChromeExtId) {
    return LazyLoader.dependencyLoad([
      '/js/screenSharingView.js'
    ]).then(function() {
      debug = new Utils.MultiLevelLogger('screenSharingController.js',
                                         Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

      Utils.addEventsHandlers('screenSharingView:', viewEventHandlers, globals);
      _isSharing = false;
      _userName = aUserName;
      screenPublisherOptions.name = (aUserName ? aUserName : DEFAULT_NAME) + NAME_SUFFIX;
      _chromeExtId = aChromeExtId;
      aChromeExtId && aChromeExtId !== 'undefined' &&
        OTHelper.registerScreenSharingExtension({ chrome: aChromeExtId });
      ScreenSharingView.init();
    });
  };

  var ScreenSharingController = {
    init: init,
    get chromeExtId() {
      return _chromeExtId;
    }
  };

  globals.ScreenSharingController = ScreenSharingController;
}(this);


