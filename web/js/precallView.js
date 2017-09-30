/* globals setTimeout */
!(function (exports) {
  'use strict';

  var _templateSrc = '/templates/precall.ejs';
  var _template;
  var _model;

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
          Utils.sendEvent('roomView:retest');
          break;
      }
    });

    var publishSettings = document.querySelector('.publish-settings');

    publishSettings.addEventListener('click', function (e) {
      var initialVideoSwitch = document.querySelector('#initialVideoSwitch');
      var initialAudioSwitch = document.querySelector('#initialAudioSwitch');
      var elem = e.target;
      elem.blur();
      // pointer-events is not working on IE so we can receive as target a child
      elem = HTMLElems.getAncestorByTagName(elem, 'a');
      if (!elem) {
        return;
      }
      switch (elem.id) {
        case 'initialAudioSwitch':
          if (!initialAudioSwitch.classList.contains('activated')) {
            setSwitchStatus(true, true, 'Audio', 'roomView:initialAudioSwitch');
          } else {
            setSwitchStatus(false, true, 'Audio', 'roomView:initialAudioSwitch');
          }
          break;
        case 'initialVideoSwitch':
          if (!initialVideoSwitch.classList.contains('activated')) {
            setSwitchStatus(true, true, 'Video', 'roomView:initialVideoSwitch');
          } else {
            setSwitchStatus(false, true, 'Video', 'roomView:initialVideoSwitch');
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
    _template.render().then(function (aHTML) {
      document.body.innerHTML += aHTML;
      addHandlers();
      resolve();
    });
  }

  var eventHandlers = {
    'PrecallController:endPrecall': function () {
      _model.addEventListener('value', render);
      render();
    },
    'PrecallController:audioOnly': function () {
      setSwitchStatus(false, true, 'Audio', 'roomView:initialVideoSwitch');
    }
  };

  var setRoomName = function (roomName) {
    document.querySelector('.user-name-modal button .room-name').textContent = 'Join ' + roomName;
    document.getElementById('name-heading').textContent = roomName;
  };

  var setUsername = function (username) {
    document.getElementById('video-preview-name').textContent = username;
    setTimeout(function () {
      document.getElementById('video-preview-name').style.opacity = 0;
    }, 2000);
  };


  var alreadyInitialized = false;

  exports.EJS = function (aTemplateOptions) {
    if (aTemplateOptions.url) {
      this._templatePromise =
        exports.Request.sendXHR('GET', aTemplateOptions.url, null, null, 'text')
          .then(function (aTemplateSrc) {
            return exports.ejs.compile(aTemplateSrc, { filename: aTemplateOptions.url });
          });
    } else {
      this._templatePromise = Promise.resolve(exports.ejs.compile(aTemplateOptions.text));
    }
    this.render = function (aData) {
      return this._templatePromise.then(function (aTemplate) {
        return aTemplate(aData);
      });
    };
  };

  var init = function () {
    return new Promise(function (resolve) {
      if (alreadyInitialized) {
        return resolve();
      }

      Utils.addEventsHandlers('', eventHandlers);
      _template = new exports.EJS({ url: _templateSrc });
      alreadyInitialized = true;
      return render(resolve);
    });
  };

  var hide = function () {
    document.getElementById('video-preview').style.visibility = 'hidden';
    document.getElementById('dock').style.visibility = 'visible';
  };

  var setVolumeMeterLevel = function (level) {
    var meterLevel = document.getElementById('audioMeterLevel');
    meterLevel.style.width = (level * 89) + 'px';
  };

  var startPrecallTestMeter = function () {
    var meterLevel = document.getElementById('precallTestMeterLevel');
    meterLevel.style.width = 0;
    var preCallTestProgress = 0;
    var testMeterInterval = setInterval(function () {
      preCallTestProgress++;
      meterLevel.style.width = ((preCallTestProgress * 89) / 15) + 'px';
      if (preCallTestProgress === 15) {
        clearInterval(testMeterInterval);
      }
    }, 1000);
  };

  var displayNetworkTestResults = function (results) {
    var packetLossStr;
    document.getElementById('pre-call-test-results').style.display = 'block';
    document.getElementById('audio-bitrate').innerText =
      Math.round(results.audio.bitsPerSecond / 1000);
    if (results.video && results.text !== 'Your bandwidth can support audio only.') {
      document.getElementById('video-bitrate').innerText =
        Math.round(results.video.bitsPerSecond / 1000);
      packetLossStr = isNaN(results.video.packetLossRatio) ? '' :
        Math.round(100 * results.video.packetLossRatio) + '% packet loss';
      document.getElementById('precall-video-packet-loss').innerText = packetLossStr;
      document.getElementById('precall-audio-results').style.width = '50%';
      document.getElementById('precall-audio-results').style.right = '0';
      document.getElementById('precall-video-results').style.display = 'block';
    } else {
      document.getElementById('precall-audio-results').style.width = '100%';
      document.getElementById('precall-audio-results').style['text-align'] = 'center';
      document.getElementById('precall-video-results').style.display = 'none';
    }
    var precallHeading = document.getElementById('pre-call-heading');
    switch (results.icon) {
      case 'precall-tick':
        precallHeading.style.color = '#3fbe36';
        break;
      case 'precall-warning':
        precallHeading.style.color = '#ffcc33';
        break;
      case 'precall-error':
        precallHeading.style.color = '#ff0000';
        break;
    }
    document.getElementById('pre-call-description').innerText = results.text;
    document.getElementById('precall-icon').setAttribute('data-icon', results.icon);
    packetLossStr = isNaN(results.audio.packetLossRatio) ? '' :
      Math.round(100 * results.audio.packetLossRatio) + '% packet loss';
    document.getElementById('precall-audio-packet-loss').innerText = packetLossStr;
  };

  function setSwitchStatus(status, bubbleUp, switchName, evtName) {
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
    bubbleUp && newStatus !== oldStatus && Utils.sendEvent(evtName, { status: newStatus });
  }

  exports.PrecallView = {
    init: init,
    hide: hide,
    setRoomName: setRoomName,
    setUsername: setUsername,
    setVolumeMeterLevel: setVolumeMeterLevel,
    startPrecallTestMeter: startPrecallTestMeter,
    displayNetworkTestResults: displayNetworkTestResults
  };
}(this));
