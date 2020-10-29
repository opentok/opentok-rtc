// eslint-disable-next-line no-unused-vars
/* global Modal, OTNetworkTest, PrecallView, showTos, showUnavailable */

!((exports) => {
  const endPrecall = () => {
    Utils.sendEvent('PrecallController:endPrecall');
  };
  let otNetworkTest;
  let publisher;
  let previewOptions;
  const publisherOptions = {
    publishAudio: true,
    publishVideo: true,
    name: '',
    width: '100%',
    height: '100%',
    insertMode: 'append',
    showControls: false,
  };

  const storedAudioDeviceId = window.localStorage.getItem('audioDeviceId');
  const storedVideoDeviceId = window.localStorage.getItem('videoDeviceId');
  if (storedAudioDeviceId) publisherOptions.audioSource = storedAudioDeviceId;
  if (storedVideoDeviceId) publisherOptions.videoSource = storedVideoDeviceId;

  function showCallSettingsPrompt(roomName, username, otHelper) {
    const selector = '.user-name-modal';

    const videoPreviewEventHandlers = {
      toggleFacingMode() {
        otHelper.toggleFacingMode().then((dev) => {
          const { deviceId } = dev;
          publisherOptions.videoSource = deviceId;
          window.localStorage.setItem('videoDeviceId', deviceId);
        });
      },
      setAudioSource(evt) {
        const deviceId = evt.detail;
        otHelper.setAudioSource(deviceId);
        publisherOptions.audioSource = deviceId;
        window.localStorage.setItem('audioDeviceId', deviceId);
      },
      initialAudioSwitch(evt) {
        publisher.publishAudio(evt.detail.status);
        publisherOptions.publishAudio = evt.detail.status;
      },
      initialVideoSwitch(evt) {
        publisher.publishVideo(evt.detail.status);
        publisherOptions.publishVideo = evt.detail.status;
      },
      retest() {
        PrecallView.startPrecallTestMeter();
        otNetworkTest.startNetworkTest((error, result) => {
          if (!error) {
            PrecallView.displayNetworkTestResults(result);
          }
        });
      },
      cancelTest() {
        PrecallView.hideConnectivityTest();
        otNetworkTest.stopTest();
      },
    };

    return new Promise((resolve) => {
      if (window.routedFromStartMeeting) {
        publisherOptions.name = window.userName || document.querySelector(`${selector} input`).value.trim();
        publisherOptions.publishVideo = window.publishVideo;
        publisherOptions.publishAudio = window.publishAudio;
        return resolve({
          username: window.userName || document.querySelector(`${selector} input`).value.trim(),
          publisherOptions,
        });
      }

      function loadModalText() {
        window.autoGenerateRoomName ? PrecallView.setFocus('user') : PrecallView.setFocus('room');

        if (Utils.isSafariIOS()) {
          if (window.enablePrecallTest) PrecallView.hideConnectivityTest();
        }

        document.querySelector('.user-name-modal #enter').disabled = false;
        document.querySelector('.user-name-modal').addEventListener('keypress', (event) => {
          if (event.which === 13) {
            event.preventDefault();
            submitForm();
          }
        });

        document.querySelector('.user-name-modal').addEventListener('submit', (event) => {
          event.preventDefault();
          submitForm();
        });

        function hidePrecall() {
          PrecallView.hide();
          publisher && publisher.destroy();
          otNetworkTest && otNetworkTest.stopTest();
          const username = document.querySelector(`${selector} input`).value.trim();
          window.localStorage.setItem('username', username);
          publisherOptions.name = username;
          setTimeout(() => {
            resolve({
              username,
              publisherOptions,
            });
          }, 1);
        }

        function submitRoomForm() {
          function isAllowedToJoin() {
            return new Promise((resolve, reject) => {
              Request
                .getRoomRawInfo(roomName).then((room) => {
                  if (window.routedFromStartMeeting) {
                    return resolve();
                  } if (showUnavailable && !room) {
                    return reject(new Error('New rooms not allowed'));
                  } if (room && !room.isLocked) {
                    return resolve();
                  } if (!showUnavailable && !room) {
                    return resolve();
                  } if (room && room.isLocked) {
                    return reject(new Error('Room locked'));
                  }
                  // default
                  return reject(new Error('Unknown Room State'));
                });
            });
          }

          isAllowedToJoin().then(() => {
            if (showTos) {
              PrecallView.showContract().then(hidePrecall);
            } else {
              hidePrecall();
            }
          }).catch((e) => {
            if (e.message === 'Room locked') {
              PrecallView.showLockedMessage();
            } else {
              PrecallView.showUnavailableMessage();
            }
          });
        }

        function submitForm() {
          if (!window.autoGenerateRoomName && !document.getElementById('room-name-input').value) {
            const errorMsg = document.querySelector('.error-room.error-text');
            document.querySelector('.room-name-input-container label').style.display = 'none';
            errorMsg.classList.add('show');
            return;
          }

          if (window.location.href.indexOf('room') > -1) {
            // Jeff to do: This code should move to RoomController and be event-driven
            submitRoomForm();
          } else if (showTos) {
            PrecallView.showContract().then(() => {
              Utils.sendEvent('precallView:submit');
            });
          } else {
            Utils.sendEvent('precallView:submit');
          }
        }

        otHelper.initPublisher('video-preview', publisherOptions)
          .then((pub) => {
            publisher = pub;

            otHelper.getVideoDeviceNotInUse(publisherOptions.videoSource)
              .then((videoSourceId) => {
                previewOptions = {
                  apiKey: window.precallApiKey,
                  resolution: '640x480',
                  sessionId: window.precallSessionId,
                  token: window.precallToken,
                  videoSource: videoSourceId,
                };

                publisher.on('accessAllowed', () => {
                  otHelper.getDevices('audioInput').then((audioDevs) => {
                    // eslint-disable-next-line max-len
                    PrecallView.populateAudioDevicesDropdown(audioDevs, publisherOptions.audioSource);
                  });
                  // You cannot use the network test in Safari because you cannot use two
                  // eslint-disable-next-line max-len
                  // publishers (the preview publisher and the network test publisher) simultaneously.
                  if (!Utils.isSafariIOS() && window.enablePrecallTest) {
                    PrecallView.startPrecallTestMeter();
                    otNetworkTest = new OTNetworkTest(previewOptions);
                    otNetworkTest.startNetworkTest((error, result) => {
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
            let movingAvg = null;
            publisher.on('audioLevelUpdated', (event) => {
              if (movingAvg === null || movingAvg <= event.audioLevel) {
                movingAvg = event.audioLevel;
              } else {
                movingAvg = (0.8 * movingAvg) + (0.2 * event.audioLevel);
              }

              // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
              let logLevel = ((Math.log(movingAvg) / Math.LN10) / 1.5) + 1;
              logLevel = Math.min(Math.max(logLevel, 0), 1);
              PrecallView.setVolumeMeterLevel(logLevel);
            });
          });
        const userNameInputElement = document.getElementById('user-name-input');
        const storedUsername = window.localStorage.getItem('username');
        if (username) {
          document.getElementById('settings-prompt').style.display = 'none';
          userNameInputElement.value = username;
          userNameInputElement.setAttribute('readonly', true);
        } else if (storedUsername) {
          userNameInputElement.value = storedUsername;
          document.querySelector('.user-name-input-container').classList.add('visited');
        }
      }
      otHelper.otLoaded.then(loadModalText);
    });
  }

  const eventHandlers = {
    'roomView:endprecall': endPrecall,
  };

  const init = () => new Promise((resolve) => {
    LazyLoader.dependencyLoad([
      '/js/helpers/ejsTemplate.js',
      '/js/vendor/ejs_production.js',
      '/js/min/precallView.min.js',
    ]).then(() => {
      Utils.addEventsHandlers('', eventHandlers);
      return PrecallView.init();
    }).then(() => {
      resolve();
    });
  });

  exports.PrecallController = {
    init,
    showCallSettingsPrompt,
  };
})(this);
