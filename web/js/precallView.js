// eslint-disable-next-line no-unused-vars
/* globals EJSTemplate, Modal, setTimeout, showTos, showUnavailable, enablePrecallTest, enterButtonLabel */
!(exports => {
  const _precallTemplateSrc = '/templates/precall.ejs';
  let _precallTemplate;
  const _tosTemplateSrc = '/templates/tos.ejs';
  const _unavailableTemplateSrc = '/templates/unavailable.ejs';
  let _unavailableTemplate;
  const _lockedTemplateSrc = '/templates/locked.ejs';
  let _lockedTemplate;
  let _tosTemplate;
  let _model;
  let testMeterInterval;

  const addHandlers = () => {
    if (window.enablePrecallTest) {
      const preCallTestResults = document.getElementById('pre-call-test-results');

      preCallTestResults.addEventListener('click', e => {
        const elem = e.target;
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

      const connectivityCancelElement = document.getElementById('connectivity-cancel');
      connectivityCancelElement.addEventListener('click', event => {
        event.preventDefault();
        Utils.sendEvent('roomView:cancelTest');
        connectivityCancelElement.style.display = 'none';
        preCallTestResults.style.display = 'none';
        hideConnectivityTest();
      });
    }

    const userNameInputElement = document.getElementById('user-name-input');
    userNameInputElement.addEventListener('keypress', function keypressHandler() {
      document.querySelector('.user-name-input-container').classList.add('visited');
      userNameInputElement.removeEventListener('keypress', keypressHandler);
    });

    document.querySelector('.user-name-modal').addEventListener('click', () => {
      userNameInputElement.focus();
    });

    const publishSettings = document.querySelector('.publish-settings');

    publishSettings.addEventListener('click', e => {
      const initialVideoSwitch = document.querySelector('#initialVideoSwitch');
      const initialAudioSwitch = document.querySelector('#initialAudioSwitch');

      setTimeout(() => {
        // This must be done asynchronously to hide the virtual keyboard in iOS:
        document.activeElement.blur();
      }, 1);

      // pointer-events is not working on IE so we can receive as target a child
      const elem = HTMLElems.getAncestorByTagName(e.target, 'a');

      if (!elem) {
        return;
      }
      switch (elem.id) {
        case 'preToggleFacingMode': {
          Utils.sendEvent('roomView:toggleFacingMode');
          break;
        }
        case 'prePickMic': {
          const select = document.getElementById('select-devices');
          select.style.display = 'inline-block';
          Modal.showConfirm({
            head: 'Set mic input',
            detail: 'Please identify the audio source in the following list:',
            button: 'Set'
          }, true).then(start => {
            if (start) {
              Utils.sendEvent('roomView:setAudioSource', select.value);
            }
            select.style.display = 'none';
          });
          break;
        }
        case 'initialAudioSwitch': {
          if (!initialAudioSwitch.classList.contains('activated')) {
            setSwitchStatus(true, 'Audio', 'roomView:initialAudioSwitch');
          } else {
            setSwitchStatus(false, 'Audio', 'roomView:initialAudioSwitch');
          }
          break;
        }
        case 'initialVideoSwitch': {
          if (!initialVideoSwitch.classList.contains('activated')) {
            setSwitchStatus(true, 'Video', 'roomView:initialVideoSwitch');
          } else {
            setSwitchStatus(false, 'Video', 'roomView:initialVideoSwitch');
          }
          break;
        }
      }
    });

  };

  function render(resolve) {
    // eslint-disable-next-line max-len
    const templatePromises = [_precallTemplate.render(), _unavailableTemplate.render(), _lockedTemplate.render()];
    if (showTos) {
      templatePromises.push(_tosTemplate.render());
    }
    Promise.all(templatePromises).then(htmlStrings => {
      htmlStrings.forEach(aHTML => {
        document.body.insertAdjacentHTML('afterbegin', aHTML);
      });

      if (window.routedFromStartMeeting) {
        document.querySelector('.main').style.display = 'none';
        resolve();
      }
      addHandlers();
      if (window.enablePrecallTest) {
        document.getElementById('pre-call-test').style.display = 'flex';
        document.getElementById('precall-test-meter').style.display = 'block';
      }
      resolve();
    });
  }

  const eventHandlers = {
    'PrecallController:endPrecall': function () {
      _model.addEventListener('value', render);
      render();
    },
    'PrecallController:audioOnly': function () {
      setSwitchStatus(false, 'Video', 'roomView:initialVideoSwitch');
    }
  };

  const setFocus = username => {
    const focusElement = username ? document.getElementById('enter')
      : document.getElementById('user-name-input');
    focusElement && focusElement.focus();
  };

  var hideConnectivityTest = () => {
    document.getElementById('pre-call-test').style.display = 'none';
    document.getElementById('precall-test-meter').style.display = 'none';
  };

  const populateAudioDevicesDropdown = (audioDevices, selectedDevId) => {
    const select = document.getElementById('select-devices');
    audioDevices.forEach(device => {
      const option = document.createElement('option');
      option.text = device.label;
      option.value = device.deviceId;
      if (option.value === selectedDevId) option.selected = true;
      select.appendChild(option);
    });
  };

  let alreadyInitialized = false;

  const init = () => {
    return new Promise(resolve => {
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

  const showModal = () => {
    Utils.removeEventHandlers('modal:', { close: showModal });
    Modal.show('.user-name-modal');
  };

  const showUnavailableMessage = () => {
    const selector = '.tc-modal.unavailable';
    return Modal.show(selector, null, true);
  };

  const showLockedMessage = () => {
    const selector = '.tc-modal.locked';
    return Modal.show(selector, null, true);
  };

  const showContract = () => {
    const selector = '.tc-modal.contract';
    const acceptElement = document.querySelector(`${selector} .accept`);
    return Modal.show(selector, null, true)
      .then(() => {
        return new Promise(resolve => {
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

  const hide = () => {
    document.querySelector('.main').style.display = 'none';
    Utils.removeEventHandlers('modal:', { close: showModal });
  };

  const setVolumeMeterLevel = level => {
    document.getElementById('audio-meter-level').style.width = `${level * 89}px`;
  };

  const startPrecallTestMeter = () => {
    const TEST_DURATION_MAX = 200; // 20 seconds
    const meterLevel = document.getElementById('precall-test-meter-level');
    setSwitchStatus(true, 'Video', 'roomView:initialVideoSwitch');
    document.querySelector('#test-status label').innerText = 'Testing audio / video quality…';
    meterLevel.style.width = 0;
    meterLevel.style['animation-play-state'] = 'running';
    let preCallTestProgress = 0;
    testMeterInterval = setInterval(() => {
      preCallTestProgress++;
      setTestMeterLevel(preCallTestProgress / TEST_DURATION_MAX);
      if (preCallTestProgress === TEST_DURATION_MAX) {
        clearInterval(testMeterInterval);
      }
    }, 100);
  };

  var setTestMeterLevel = value => {
    const width = value * document.getElementById('precall-test-meter').offsetWidth;
    document.getElementById('precall-test-meter-level').style.width = `${width}px`;
  };

  const displayNetworkTestResults = results => {
    let packetLossStr;

    clearInterval(testMeterInterval);
    document.querySelector('#test-status label').innerText = 'Done.';
    document.getElementById('precall-test-meter-level').style['animation-play-state'] = 'paused';
    setTestMeterLevel(1);
    document.getElementById('connectivity-cancel').style.display = 'none';

    document.getElementById('pre-call-test-results').style.display = 'block';
    document.getElementById('audio-bitrate').innerText = Math.round(results.audio.bitsPerSecond / 1000);
    if (results.video) {
      document.getElementById('video-bitrate').innerText = Math.round(results.video.bitsPerSecond / 1000);
      packetLossStr = isNaN(results.video.packetLossRatio) ? ''
        : `${Math.round(100 * results.video.packetLossRatio)}% packet loss`;
      document.getElementById('precall-video-packet-loss').innerText = packetLossStr;
    } else {
      document.getElementById('video-bitrate').innerText = 0;
      document.getElementById('precall-video-packet-loss').innerText = 'No video.';
    }
    const precallHeadingElement = document.getElementById('pre-call-heading');
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
    packetLossStr = isNaN(results.audio.packetLossRatio) ? ''
      : `${Math.round(100 * results.audio.packetLossRatio)}% packet loss`;
    document.getElementById('precall-audio-packet-loss').innerText = packetLossStr;
  };

  function setSwitchStatus(status, switchName, evtName) {
    const elementId = `initial${switchName}Switch`;
    const domElem = document.getElementById(elementId);
    const labelElement = domElem.querySelector('label');
    const oldStatus = domElem.classList.contains('activated');
    let newStatus;
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
    setFocus,
    setVolumeMeterLevel,
    showContract,
    showUnavailableMessage,
    showLockedMessage,
    startPrecallTestMeter,
    displayNetworkTestResults,
    hideConnectivityTest
  };
})(this);
