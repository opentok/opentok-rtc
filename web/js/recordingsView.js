!function(exports) {
  'use strict';

  function render(archives) {
    if (!archives) {
      return;
    }

    var list = document.querySelector('.videos.tc-list ul');

    list.innerHTML = '';

    var sortingDescending = function(a, b) {
      var tA = archives[a].createdAt;
      var tB = archives[b].createdAt;

      return tB - tA;
    };

    var total = 0;
    Object.keys(archives).
           sort(sortingDescending).
           forEach(function(archiveId) {
      var archive = archives[archiveId];

      ++total;
      var url = archive.localDownloadURL;
      var name = archive.name;
      var item = HTMLElems.createElementAt(list, 'li');

      HTMLElems.createElementAt(item, 'a', {
        'target': '_blank',
        'href': url,
        'data-status': archive.status
      }, name);
    });

    RoomView.recordingsNumber = total;
  }

  var init = function(model) {
    model.addEventListener('value', render);
    render(model.archives);
  };

  exports.RecordingsView = {
    init: init
  };

}(this);
