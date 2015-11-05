!function(exports) {
  'use strict';

  var listSelector = '.videos.tc-list ul';

  var video_extension = 'mp4';

  var formatter  = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  function getLabelText(archive) {
    var date = new Date(archive.createdAt);

    var time = formatter.format(date).toLowerCase();

    var prefix = '';
    time.indexOf(':') === 1 && (prefix = '0');

    var duration = (new Date(archive.duration * 1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];

    var label = [prefix, time, ' - ', archive.recordingUser, '\'s Archive (',
                 duration, 's)'];

    return label.join('');
  }

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
      var item = HTMLElems.createElementAt(list, 'li');

      item.dataset.status = archive.status;

      HTMLElems.createElementAt(item, 'a', {
        'target': '_blank',
        'href': url
      }, getLabelText(archive)).classList.add('file');

      HTMLElems.createElementAt(item, 'i', {
        'data-id': archive.id,
        'data-icon': 'delete',
        'data-action': 'delete',
        'data-username': archive.recordingUser
      });

      HTMLElems.createElementAt(item, 'a', {
        'data-icon': 'download',
        'href': url,
        'download': archive.name + '.' + video_extension
      }).classList.add('download');
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
            username: dataset.username,
            set status(value) {
              elemClicked.parentNode.dataset.status = value;
            },
            get status() {
              return elemClicked.parentNode.dataset.status;
            }
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
