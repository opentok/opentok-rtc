!function(exports) {
  'use strict';

  var VIDEO_EXT = 'mp4';
  var LIST_SELECTOR = '.videos.tc-list ul';
  var MAIN_PAGE = '/index.html';

  var _templateSrc = '/templates/endMeeting.ejs';
  var _template;
  var _model;
  var _sessionId;

  var addHandlers = function() {
    HTMLElems.addHandlerArchive(LIST_SELECTOR);
    var btn = document.getElementById('newCall');
    btn.addEventListener('click', function clicked(evt) {
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

    var html = _template.render(data);
    document.body.innerHTML = html;
    addHandlers();
  };

  var eventHandlers = {
    'EndCallController:endCall': function(evt) {
      _model.addEventListener('value', render);
      render(_model.archives);
    }
  };

  var alreadyInitialized = false;

  var init = function(model, sessionId) {
    _model = model;
    _sessionId = sessionId;
    if (alreadyInitialized) {
      return;
    }
    Utils.addEventsHandlers('', eventHandlers);
    _template = new EJS({ url: _templateSrc });
    alreadyInitialized = true;
  };

  exports.EndCallView = {
    init: init
  };

}(this);
