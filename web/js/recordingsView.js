!(function(exports) {
  'use strict';

  var LIST_SELECTOR = '.videos.tc-list ul';

  var VIDEO_EXTENSION = 'mp4';

  function render(archives) {
    if (!archives) {
      return;
    }

    var bubble = document.querySelector('[for="viewRecordings"]');
    if (!bubble) {
      return;
    }
    bubble.data('recordings', Object.keys(archives).length);

    var list = bubble.querySelector(LIST_SELECTOR);

    list.innerHTML = '';

    var sortingDescending = function(a, b) {
      var tA = archives[a].createdAt;
      var tB = archives[b].createdAt;

      return tB - tA;
    };

    var total = 0;
    Object.keys(archives)
           .sort(sortingDescending)
           .forEach(function(archiveId) {
             var archive = archives[archiveId];
             ++total;
             var url = archive.localDownloadURL;
             var item = HTMLElems.createElementAt(list, 'li');

             item.data('status', archive.status);

             HTMLElems.createElementAt(item, 'a', {
               target: '_blank',
               href: url + '?generatePreview'
             }, Utils.getLabelText(archive)).classList.add('file');

             HTMLElems.createElementAt(item, 'i', {
               'data-id': archive.id,
               'data-icon': 'delete',
               'data-action': 'delete',
               'data-username': archive.recordingUser
             });

             HTMLElems.createElementAt(item, 'a', {
               'data-icon': 'download',
               href: url,
               download: archive.name + '.' + VIDEO_EXTENSION
             }).classList.add('download');
           });

    RoomView.recordingsNumber = total;
  }

  var addHandlers = function() {
    HTMLElems.addHandlerArchive(LIST_SELECTOR);
  };

  var init = function(model) {
    document.body.data('downloadAvailable', Utils.isChrome());
    model.addEventListener('value', render);
    render(model.archives);
    addHandlers();
  };

  exports.RecordingsView = {
    init: init
  };
}(this));
