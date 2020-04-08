/* globals EJSTemplate, Modal, setTimeout, showTos, showUnavailable, enablePrecallTest */
!(function (exports) {
  'use strict';

  var _precallTemplateSrc = '/templates/precall.ejs';
  var _precallTemplate;
  var _tosTemplateSrc = '/templates/tos.ejs';
  var _unavailableTemplateSrc = '/templates/unavailable.ejs';
  var _unavailableTemplate;
  var _lockedTemplateSrc = '/templates/locked.ejs';
  var _lockedTemplate;
  var _tosTemplate;
  var _model;
  var testMeterInterval;

  var addHandlers = function () {
    var preCallTestResults = document.getElementById('pre-call-test-results');

    preCallTestResults.addEventListener('click', function (e) {
      var elem = e.target;
      switch (elem.id) {
        case 'precall-close':
          preCallTestResults.style.display = 'none';
          break;
        case 'retest':
          preCallTestResults.style.display = 'none';
          document.getElementById('connectivity-cancel').style.display = 'inline-block';
          Utils.sendEvent('roomView:retest');
          break;
      }
    });

    var connectivityCancelElement = document.getElementById('connectivity-cancel');
    connectivityCancelElement.addEventListener('click', function (event) {
      event.preventDefault();
      Utils.sendEvent('roomView:cancelTest');
      connectivityCancelElement.style.display = 'none';
      preCallTestResults.style.display = 'none';
      hideConnectivityTest();
    });

    var userNameInputElement = document.getElementById('user-name-input');
    userNameInputElement.addEventListener('keyup', function keyupHandler() {
      document.querySelector('#enter-name-prompt label').classList.add('visited');
      userNameInputElement.removeEventListener('keyup', keyupHandler);
    });

    document.querySelector('.user-name-modal').addEventListener('click', function () {
      userNameInputElement.focus();
    });

    var publishSettings = document.querySelector('.publish-settings');

    publishSettings.addEventListener('click', function (e) {
      var initialVideoSwitch = document.querySelector('#initialVideoSwitch');
      var initialAudioSwitch = document.querySelector('#initialAudioSwitch');

      setTimeout(function () {
        // This must be done asynchronously to hide the virtual keyboard in iOS:
        document.activeElement.blur();
      }, 1);

      // pointer-events is not working on IE so we can receive as target a child
      var elem = HTMLElems.getAncestorByTagName(e.target, 'a');

      if (!elem) {
        return;
      }
      switch (elem.id) {
        case 'preToggleFacingMode':
          Utils.sendEvent('roomView:toggleFacingMode');
          break;
        case 'prePickMic':
          var select = document.getElementById('select-devices');
          select.style.display = 'inline-block';
          Modal.showConfirm({
            head: 'Set mic input',
            detail: 'Please identify the audio source in the following list:',
            button: 'Set'
          }, true).then(function (start) {
            if (start) {
              Utils.sendEvent('roomView:setAudioSource', select.value);
            }
            select.style.display = 'none';
          });
          break;
        case 'initialAudioSwitch':
          if (!initialAudioSwitch.classList.contains('activated')) {
            setSwitchStatus(true, 'Audio', 'roomView:initialAudioSwitch');
          } else {
            setSwitchStatus(false, 'Audio', 'roomView:initialAudioSwitch');
          }
          break;
        case 'initialVideoSwitch':
          if (!initialVideoSwitch.classList.contains('activated')) {
            setSwitchStatus(true, 'Video', 'roomView:initialVideoSwitch');
          } else {
            setSwitchStatus(false, 'Video', 'roomView:initialVideoSwitch');
          }
          break;
      }
    });

    var videoPreviewElement = document.getElementById('video-preview');
    var videoPreviewNameElement = document.getElementById('video-preview-name');
    videoPreviewElement.addEventListener('mouseover', function () {
      videoPreviewNameElement.style.opacity = 1;
    });
    videoPreviewElement.addEventListener('mouseout', function () {
      videoPreviewNameElement.style.opacity = 0;
    });
  };

  function render(resolve) {
    var templatePromises = [_precallTemplate.render(), _unavailableTemplate.render(), _lockedTemplate.render()];
    if (showTos) {
      templatePromises.push(_tosTemplate.render());
    }
    Promise.all(templatePromises).then(function (htmlStrings) {
      htmlStrings.forEach(function (aHTML) {
        document.body.innerHTML += aHTML;
      });
      addHandlers();
      if (enablePrecallTest) {
        document.getElementById('pre-call-test').style.display = 'flex';
        document.getElementById('precall-test-meter').style.display = 'block';
      }
      resolve();
    });
  }

  var eventHandlers = {
    'PrecallController:endPrecall': function () {
      _model.addEventListener('value', render);
      render();
    },
    'PrecallController:audioOnly': function () {
      setSwitchStatus(false, 'Video', 'roomView:initialVideoSwitch');
    }
  };

  var setRoomName = function (roomName) {
    document.querySelector('.user-name-modal button .room-name').textContent = 'Join "' + roomName + '"';
  };

  var setUsername = function (username) {
    document.getElementById('video-preview-name').textContent = username;
    setTimeout(function () {
      document.getElementById('video-preview-name').style.opacity = 0;
    }, 2000);
  };

  var setFocus = function (username) {
    var focusElement = username ? document.getElementById('enter') :
      document.getElementById('user-name-input');
    focusElement.focus();
  };

  var hideConnectivityTest = function () {
    document.getElementById('pre-call-test').style.display = 'none';
    document.getElementById('precall-test-meter').style.display = 'none';
  };

  var populateAudioDevicesDropdown = function (audioDevices, selectedDevId) {
    var select = document.getElementById('select-devices');
    audioDevices.forEach(function (device) {
      var option = document.createElement('option');
      option.text = device.label;
      option.value = device.deviceId;
      if (option.value === selectedDevId) option.selected = true;
      select.appendChild(option);
    });
  };

  var alreadyInitialized = false;

  var init = function () {
    return new Promise(function (resolve) {
      if (alreadyInitialized) {
        return resolve();
      }

      Utils.addEventsHandlers('', eventHandlers);
      _precallTemplate = new EJSTemplate({ url: _precallTemplateSrc });
      if (showTos) {
        _tosTemplate = new EJSTemplate({ url: _tosTemplateSrc });
      }
      _unavailableTemplate = new EJSTemplate({ url: _unavailableTemplateSrc });
      _lockedTemplate = new EJSTemplate({ url: _lockedTemplateSrc });
      alreadyInitialized = true;
      return render(resolve);
    });
  };

  var showModal = function () {
    Utils.removeEventHandlers('modal:', { close: showModal });
    Modal.show('.user-name-modal');
  };

  var showUnavailableMessage = function () {
    var selector = '.tc-modal.unavailable';
    return Modal.show(selector, null, true);
  };

  var showLockedMessage = function () {
    var selector = '.tc-modal.locked';
    return Modal.show(selector, null, true);
  };

  var showContract = function () {
    var selector = '.tc-modal.contract';
    var acceptElement = document.querySelector(selector + ' .accept');
    return Modal.show(selector, null, true)
      .then(function () {
        return new Promise(function (resolve) {
          acceptElement.addEventListener('click', function onClicked(evt) {
            acceptElement.removeEventListener('click', onClicked);
            evt.preventDefault();
            sessionStorage.setItem('tosAccepted', true);
            Modal.hide(selector);
            resolve();
          });

          Utils.addEventsHandlers('modal:', { close: showModal });
        });
      });
  };

  var hide = function () {
    document.getElementById('video-preview').style.visibility = 'hidden';
    Utils.removeEventHandlers('modal:', { close: showModal });
  };

  var setVolumeMeterLevel = function (level) {
    document.getElementById('audio-meter-level').style.width = (level * 89) + 'px';
  };

  var startPrecallTestMeter = function () {
    var TEST_DURATION_MAX = 200; // 20 seconds
    var meterLevel = document.getElementById('precall-test-meter-level');
    setSwitchStatus(true, 'Video', 'roomView:initialVideoSwitch');
    document.querySelector('#test-status label').innerText = 'Testing audio / video quality…';
    meterLevel.style.width = 0;
    meterLevel.style['animation-play-state'] = 'running';
    var preCallTestProgress = 0;
    testMeterInterval = setInterval(function () {
      preCallTestProgress++;
      setTestMeterLevel(preCallTestProgress / TEST_DURATION_MAX);
      if (preCallTestProgress === TEST_DURATION_MAX) {
        clearInterval(testMeterInterval);
      }
    }, 100);
  };

  var setTestMeterLevel = function (value) {
    var width = value * document.getElementById('precall-test-meter').offsetWidth;
    document.getElementById('precall-test-meter-level').style.width = width + 'px';
  };

  var displayNetworkTestResults = function (results) {
    var packetLossStr;

    clearInterval(testMeterInterval);
    document.querySelector('#test-status label').innerText = 'Done.';
    document.getElementById('precall-test-meter-level').style['animation-play-state'] = 'paused';
    setTestMeterLevel(1);
    document.getElementById('connectivity-cancel').style.display = 'none';

    document.getElementById('pre-call-test-results').style.display = 'block';
    document.getElementById('audio-bitrate').innerText =
      Math.round(results.audio.bitsPerSecond / 1000);
    if (results.video) {
      document.getElementById('video-bitrate').innerText =
        Math.round(results.video.bitsPerSecond / 1000);
      packetLossStr = isNaN(results.video.packetLossRatio) ? '' :
        Math.round(100 * results.video.packetLossRatio) + '% packet loss';
      document.getElementById('precall-video-packet-loss').innerText = packetLossStr;
    } else {
      document.getElementById('video-bitrate').innerText = 0;
      document.getElementById('precall-video-packet-loss').innerText = 'No video.';
    }
    var precallHeadingElement = document.getElementById('pre-call-heading');
    precallHeadingElement.classList = results.classification;
    switch (results.classification) {
      case 'precall-tick':
        precallHeadingElement.innerText = 'Excellent Connectivity';
        break;
      case 'precall-warning':
        precallHeadingElement.innerText = 'OK Connectivity';
        break;
      case 'precall-error':
        precallHeadingElement.innerText = 'Poor Connectivity';
        break;
    }
    document.getElementById('pre-call-description').innerText = results.text;
    document.getElementById('precall-icon').setAttribute('data-icon', results.classification);
    packetLossStr = isNaN(results.audio.packetLossRatio) ? '' :
      Math.round(100 * results.audio.packetLossRatio) + '% packet loss';
    document.getElementById('precall-audio-packet-loss').innerText = packetLossStr;
  };

  function setSwitchStatus(status, switchName, evtName) {
    var elementId = 'initial' + switchName + 'Switch';
    var domElem = document.getElementById(elementId);
    var labelElement = domElem.querySelector('label');
    var oldStatus = domElem.classList.contains('activated');
    var newStatus;
    if (status === undefined) {
      newStatus = domElem.classList.toggle('activated');
      labelElement.innerText = 'On';
    } else {
      newStatus = status;
      if (status) {
        domElem.classList.add('activated');
        labelElement.innerText = 'On';
      } else {
        domElem.classList.remove('activated');
        labelElement.innerText = 'Off';
      }
    }
    newStatus !== oldStatus && Utils.sendEvent(evtName, { status: newStatus });
  }

  exports.PrecallView = {
    init,
    hide,
    populateAudioDevicesDropdown,
    setRoomName,
    setUsername,
    setFocus,
    setVolumeMeterLevel,
    showContract,
    showUnavailableMessage,
    showLockedMessage,
    startPrecallTestMeter,
    displayNetworkTestResults,
    hideConnectivityTest
  };
}(this));
