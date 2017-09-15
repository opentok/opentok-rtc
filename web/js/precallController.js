/* global Modal, OTNetworkTest, PrecallView, RoomView */

!(function (exports) {
  'use strict';

  var endPrecall = function () {
    Utils.sendEvent('PrecallController:endPrecall');
  };
  var otHelper;
  var otNetworkTest;
  var publisher;
  var previewOptions;
  var publisherButtons;

  var videoPreviewEventHandlers = {
    initialAudioSwitch: function (evt) {
      publisher.publishAudio(evt.detail.status);
    },
    initialVideoSwitch: function (evt) {
      publisher.publishVideo(evt.detail.status);
    },
    retest: function () {
      PrecallView.startPrecallTestMeter();
      otNetworkTest.startNetworkTest(function (error, result) {
        if (!error) {
          RoomView.displayNetworkTestResults(result);
        }
      });
    }
  };

  function showCallSettingsPrompt(roomName, username) {
    var selector = '.user-name-modal';
    return new Promise(function (resolveCallSettingsPrompt) {
      function loadModalText() {
        return new Promise(function (resolve) {
          PrecallView.setRoomName(roomName);

          document.querySelector('.user-name-modal #enter').disabled = false;
          document.querySelector('.user-name-modal .tc-dialog').addEventListener('submit',
            function (event) {
              event.preventDefault();
              PrecallView.hide();
              otNetworkTest.stopTest();
              Modal.hide(selector)
                .then(function () {
                  resolveCallSettingsPrompt({
                    username: document.querySelector(selector + ' input').value.trim()
                  });
                });
            });
          document.querySelector(selector + ' input.username').focus();

          publisher = otHelper.initPublisher('video-preview',
            { width: '100%', height: '100%', insertMode: 'append', showControls: false }
          ).then(function (publisher) {
            previewOptions = {
              apiKey: window.apiKey,
              resolution: '1280x720',
              sessionId: window.precallSessionId,
              token: window.precallToken
            };
            PrecallView.startPrecallTestMeter();
            otNetworkTest = new OTNetworkTest(publisher, previewOptions);
            otNetworkTest.startNetworkTest(function (error, result) {
              PrecallView.displayNetworkTestResults(result);
            });
            Utils.addEventsHandlers('roomView:', videoPreviewEventHandlers, exports);
            var movingAvg = null;
            publisher.on('audioLevelUpdated', function (event) {
              if (movingAvg === null || movingAvg <= event.audioLevel) {
                movingAvg = event.audioLevel;
              } else {
                movingAvg = (0.8 * movingAvg) + (0.2 * event.audioLevel);
              }

              // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
              var logLevel = ((Math.log(movingAvg) / Math.LN10) / 1.5) + 1;
              logLevel = Math.min(Math.max(logLevel, 0), 1);
              PrecallView.setVolumeMeterLevel(logLevel);
            });
          });

          if (username) {
            document.getElementById('enter-name-prompt').style.display = 'none';
            var userNameInputElement = document.getElementById('user-name-input');
            userNameInputElement.value = username;
            userNameInputElement.setAttribute('readonly', true);
          }
        });
      }
      Modal.show(selector, loadModalText);
    });
  }

  var eventHandlers = {
    'roomView:endprecall': endPrecall
  };

  var init = function (model) {
    publisherButtons = model.publisherButtons;
    otHelper = model.otHelper;
    return new Promise(function (resolve) {
      LazyLoader.dependencyLoad([
        '/js/vendor/ejs_production.js',
        '/js/precallView.js'
      ]).then(function () {
        Utils.addEventsHandlers('', eventHandlers);
        return PrecallView.init();
      }).then(function () {
        resolve();
      });
    });
  };

  exports.PrecallController = {
    init: init,
    showCallSettingsPrompt: showCallSettingsPrompt
  };
}(this));
