!(function(exports) {
  'use strict';

  var VIDEO_EXT = 'mp4';
  var LIST_SELECTOR = '.videos.tc-list ul';
  var MAIN_PAGE = '/index.html';

  var _templateSrc = '/templates/endMeeting.ejs';
  var _template;
  var _model;
  var _sessionId;

  var addHandlers = function() {
    !exports.isWebRTCVersion && HTMLElems.addHandlerArchive(LIST_SELECTOR);
    var btn = document.getElementById('newCall');
    btn && btn.addEventListener('click', function(evt) {
      evt.preventDefault();
      evt.stopImmediatePropagation();
      window.location = window.location.origin + MAIN_PAGE;
    });
  };

  function render(archives) {
    var data = {
      archives: []
    };
    var sortingDescending = function(a, b) {
      var tA = archives[a].createdAt;
      var tB = archives[b].createdAt;

      return tB - tA;
    };

    archives = archives || {};

    Object.keys(archives).sort(sortingDescending).forEach(function(archId) {
      var archive = archives[archId];
      var anArch = {};
      // data for preview
      anArch.status = archive.status;
      anArch.hrefPrev = archive.localDownloadURL + '?generatePreview';
      anArch.txtPrev = Utils.getLabelText(archive);
      // data for delete
      anArch.id = archive.id;
      anArch.recordingUser = archive.recordingUser;
      // data for download
      anArch.hrefDwnld = archive.localDownloadURL;
      anArch.dwnldName = archive.name + '.' + VIDEO_EXT;
      data.archives.push(anArch);
    });
    data.numArchives = data.archives.length;
    data.sessionId = _sessionId;
    data.isWebRTCVersion = exports.isWebRTCVersion;

    _template.render(data).then(function(aHTML) {
      document.body.innerHTML = aHTML;
      addHandlers();
    });
  }

  var eventHandlers = {
    'EndCallController:endCall': function(evt) {
      if (_model) {
        _model.addEventListener('value', render);
        render(_model.archives);
      } else {
        render();
      }
    }
  };

  var alreadyInitialized = false;

  exports.EJS = function(aTemplateOptions) {
    if (aTemplateOptions.url) {
      this._templatePromise =
        exports.Request.sendXHR('GET', aTemplateOptions.url, null, null, 'text')
          .then(function(aTemplateSrc) {
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

  var init = function(model, sessionId) {
    _model = model;
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
}(this));
