!function(exports) {
  'use strict';

  var listSelector = '.videos.tc-list ul';

  function render(archives) {
    if (!archives) {
      return;
    }

    var list = document.querySelector(listSelector);

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

      HTMLElems.createElementAt(item, 'i', {
        'data-id': archive.id,
        'data-icon': 'delete',
        'data-action': 'delete',
        'data-name': name
      });
    });

    RoomView.recordingsNumber = total;
  }

  var addHandlers = function() {
    var list = document.querySelector(listSelector);

    list.addEventListener('click', function(evt) {
      switch (evt.type) {
        case 'click':
          var elemClicked = evt.target;
          if (!(HTMLElems.isAction(elemClicked))) {
            return;
          }
          var dataset = elemClicked.dataset;
          Utils.sendEvent('archive', {
            id: dataset.id,
            action: dataset.action,
            name: dataset.name
          });
          break;
      }
    });
  };

  var init = function(model) {
    model.addEventListener('value', render);
    render(model.archives);
    addHandlers();
  };

  exports.RecordingsView = {
    init: init
  };

}(this);
