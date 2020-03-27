/* global Modal, OTNetworkTest, PrecallView, showTos, showUnavailable */

!(function (exports) {
  'use strict';

  var endPrecall = function () {
    Utils.sendEvent('PrecallController:endPrecall');
  };
  var otNetworkTest;
  var publisher;
  var previewOptions;
  var publisherOptions = {
    publishAudio: true,
    publishVideo: true,
    name: '',
    width: '100%',
    height: '100%',
    insertMode: 'append',
    showControls: false
  };

  var storedAudioDeviceId = window.localStorage.getItem('audioDeviceId');
  var storedVideoDeviceId = window.localStorage.getItem('videoDeviceId');
  if (storedAudioDeviceId) publisherOptions.audioSource = storedAudioDeviceId;
  if (storedVideoDeviceId) publisherOptions.videoSource = storedVideoDeviceId;

  function showCallSettingsPrompt(roomName, username, otHelper) {
    var selector = '.user-name-modal';

    var videoPreviewEventHandlers = {
      toggleFacingMode: function () {
        otHelper.toggleFacingMode().then(function (dev) {
          var deviceId = dev.deviceId;
          publisherOptions.videoSource = deviceId;
          window.localStorage.setItem('videoDeviceId', deviceId);
        });
      },
      setAudioSource: function (evt) {
        var deviceId = evt.detail;
        otHelper.setAudioSource(deviceId);
        publisherOptions.audioSource = deviceId;
        window.localStorage.setItem('audioDeviceId', deviceId);
      },
      initialAudioSwitch: function (evt) {
        publisher.publishAudio(evt.detail.status);
        publisherOptions.publishAudio = evt.detail.status;
      },
      initialVideoSwitch: function (evt) {
        publisher.publishVideo(evt.detail.status);
        publisherOptions.publishVideo = evt.detail.status;
      },
      retest: function () {
        PrecallView.startPrecallTestMeter();
        otNetworkTest.startNetworkTest(function (error, result) {
          if (!error) {
            PrecallView.displayNetworkTestResults(result);
          }
        });
      },
      cancelTest: function () {
        PrecallView.hideConnectivityTest();
        otNetworkTest.stopTest();
      }
    };

    return new Promise(function (resolve) {
      function loadModalText() {
        PrecallView.setRoomName(roomName);
        PrecallView.setUsername(username);
        PrecallView.setFocus(username);

        if (Utils.isIE() || Utils.isSafariIOS()) {
          PrecallView.hideConnectivityTest();
        }

        document.querySelector('.user-name-modal #enter').disabled = false;
        document.querySelector('.user-name-modal').addEventListener('keypress', function (event) {
          if (event.which === 13) {
            event.preventDefault();
            submitForm();
          }
        });

        document.querySelector('.user-name-modal .tc-dialog').addEventListener('submit', function (event) {
          event.preventDefault();
          submitForm();
        });

        function hidePrecall() {
          PrecallView.hide();
          publisher && publisher.destroy();
          if (!Utils.isIE()) {
            otNetworkTest && otNetworkTest.stopTest();
          }
          Modal.hide(selector)
            .then(function () {
              publisherOptions.name = document.querySelector(selector + ' input').value.trim();
              setTimeout(function () {
                resolve({
                  username: document.querySelector(selector + ' input').value.trim(),
                  publisherOptions: publisherOptions
                });
              }, 1);
            });
        }

        function submitForm() {
          function isAllowedToJoin() {
            return new Promise((resolve, reject) => {
              Request
                .getRoomRawInfo(roomName).then((room) => {
                  if (showUnavailable && !room) return reject('New rooms not allowed');
                  else if (room && !room.isLocked) return resolve();
                  else if (!showUnavailable && !room) return resolve();
                  else if (room && room.isLocked) return reject('locked');
                })
            });
          }

          isAllowedToJoin().then(() => {
            if (showTos) {
              PrecallView.showContract().then(hidePrecall);
            } else {
              hidePrecall();
            }
          }).catch((e) => {
            if (e === 'locked')
              PrecallView.showLockedMessage();
            else 
              PrecallView.showUnavailableMessage();
          });
        }

        otHelper.initPublisher('video-preview', publisherOptions)
        .then(function (pub) {
          publisher = pub;

          otHelper.getVideoDeviceNotInUse(publisherOptions.videoSource)
          .then(function (videoSourceId) {
            previewOptions = {
              apiKey: window.precallApiKey,
              resolution: '640x480',
              sessionId: window.precallSessionId,
              token: window.precallToken,
              videoSource: videoSourceId
            };

            publisher.on('accessAllowed', function () {
              otHelper.getDevices('audioInput').then(function (audioDevs) {
                PrecallView.populateAudioDevicesDropdown(audioDevs, publisherOptions.audioSource);
              });
              // You cannot use the network test in IE or Safari because you cannot use two
              // publishers (the preview publisher and the network test publisher) simultaneously.
              if (!Utils.isIE() && !Utils.isSafariIOS() && enablePrecallTest) {
                PrecallView.startPrecallTestMeter();
                otNetworkTest = new OTNetworkTest(previewOptions);
                otNetworkTest.startNetworkTest(function (error, result) {
                  PrecallView.displayNetworkTestResults(result);
                  if (result.audioOnly) {
                    publisher.publishVideo(false);
                    Utils.sendEvent('PrecallController:audioOnly');
                  }
                });
              }
            });
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
      }
      otHelper.otLoaded.then(function () {
        return Modal.show(selector, loadModalText).then(function () {
          PrecallView.setFocus(username);
        });
      });
    });
  }

  var eventHandlers = {
    'roomView:endprecall': endPrecall
  };

  var init = function () {
    return new Promise(function (resolve) {
      LazyLoader.dependencyLoad([
        '/js/helpers/ejsTemplate.js',
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
