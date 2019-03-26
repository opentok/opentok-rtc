/* global RoomView, OTHelper, ScreenShareView */

!(function (globals) {
  'use strict';

  var debug;
  var _chromeExtId;
  var _isSharing;
  var _hasPendingOperation = false;
  var NAME_SUFFIX = '\'s screen';
  var DEFAULT_NAME = 'Unknown';
  var otHelper;
  var enableAnnotations = false;

  var screenPublisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    name: 'screen',
    showControls: false,
    style: {
      nameDisplayMode: 'off'
    },
    publishAudio: false,
    videoSource: 'screen'
  };

  var streamHandlers = {
    destroyed: function () {
      _isSharing = false;
      Utils.sendEvent('screenShareController:destroyed');
      enableAnnotations && Utils.sendEvent('screenShareController:annotationEnded');
    }
  };

  var roomViewEvents = {
    shareScreen: function () {
      if (_hasPendingOperation) {
        return;
      }

      if (_isSharing) {
        otHelper.stopShareScreen();
        _isSharing = false;
        // We don't need to send this because desktop stream is sending a destroyed event.
      } else {
        var desktopElement = RoomView.createStreamView('desktop', {
          name: screenPublisherOptions.name,
          type: 'desktop',
          controlElems: {}
        });
        _hasPendingOperation = true;
        otHelper.shareScreen(desktopElement, screenPublisherOptions, streamHandlers,
                             enableAnnotations)
          .then(function () {
            _isSharing = true;
            _hasPendingOperation = false;
            Utils.sendEvent('screenShareController:changeScreenShareStatus',
                            { isSharing: _isSharing });
            enableAnnotations && Utils.sendEvent('screenShareController:annotationStarted');
          })
          .catch(function (error) {
            _hasPendingOperation = false;
            if (error.code === OTHelper.screenShareErrorCodes.accessDenied) {
              RoomView.deleteStreamView('desktop');
            } else {
              Utils.sendEvent('screenShareController:shareScreenError',
                              { code: error.code, message: error.message });
            }
          });
      }
    }
  };

  var screenShareViewEvents = {
    installExtension: function () {
      var newTab = window.open('https://chrome.google.com/webstore/detail/' + _chromeExtId, '_blank');
      var error = !newTab || typeof newTab !== 'object';
      Utils.sendEvent('screenShareController:extInstallationResult', {
        error: error,
        message: error ? 'It seems you have a Pop-Up blocker enabled. Please disabled it and try again.' : null
      });
      if (error) {
        debug.error('Error opening Chrome Webstore');
      }
    }
  };

  function init(aUserName, aChromeExtId, aOTHelper, aEnableAnnotations) {
    return LazyLoader.dependencyLoad([
      '/js/screenShareView.js'
    ]).then(function () {
      enableAnnotations = aEnableAnnotations;
      otHelper = aOTHelper;
      debug = new Utils.MultiLevelLogger('screenShareController.js',
                                         Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

      Utils.addEventsHandlers('roomView:', roomViewEvents, globals);
      Utils.addEventsHandlers('screenShareView:', screenShareViewEvents, globals);
      _isSharing = false;
      screenPublisherOptions.name = (aUserName || DEFAULT_NAME) + NAME_SUFFIX;
      _chromeExtId = aChromeExtId;
      aChromeExtId && aChromeExtId !== 'undefined' &&
        OTHelper.registerScreenShareExtension({ chrome: aChromeExtId }, 1);
      ScreenShareView.init(aUserName);
    });
  }

  var ScreenShareController = {
    init: init,
    get chromeExtId() {
      return _chromeExtId;
    }
  };

  globals.ScreenShareController = ScreenShareController;
}(this));
