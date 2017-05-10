!function(exports) {
  'use strict';

  var VIDEO_EXT = 'mp4';
  var LIST_SELECTOR = '.videos.tc-list ul';
  var MAIN_PAGE = '/index.html';

  var _templateSrc = '/templates/endMeeting.ejs';
  var _template;
  var _sessionId;

  var addHandlers = function() {
    var btn = document.getElementById('newCall');
    btn && btn.addEventListener('click', function clicked(evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
      window.location = window.location.origin + MAIN_PAGE;
    });
  };

  function render() {
    var data = {};
    data.sessionId = _sessionId;
    data.isWebRTCVersion = exports.isWebRTCVersion;

    _template.render(data).then(function(aHTML) {
      document.body.innerHTML = aHTML;
      addHandlers();
    });
  };

  var eventHandlers = {
    'EndCallController:endCall': function(evt) {
      render();
    }
  };

  var alreadyInitialized = false;

  exports.EJS = function(aTemplateOptions) {
    var self = this;
    if (aTemplateOptions.url) {
      this._templatePromise =
        exports.Request.sendXHR('GET', aTemplateOptions.url, null, null, 'text').
          then(function(aTemplateSrc) {
            return exports.ejs.compile(aTemplateSrc, { filename: aTemplateOptions.url });
          });
    } else {
      this._templatePromise = Promise.resolve(exports.ejs.compile(aTemplateOptions.text));
    }
    this.render = function(aData) {
      return this._templatePromise.then(function(aTemplate) {
        return aTemplate(aData);
      });
    };
  };

  var init = function(sessionId) {
    _sessionId = sessionId;
    if (alreadyInitialized) {
      return;
    }

    Utils.addEventsHandlers('', eventHandlers);
    _template = new exports.EJS({ url: _templateSrc });
    alreadyInitialized = true;
  };

  exports.EndCallView = {
    init: init
  };

}(this);
