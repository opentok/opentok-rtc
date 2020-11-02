/* global RoomView */

!((exports) => {
  const LIST_SELECTOR = '.videos.tc-list ul';

  const VIDEO_EXTENSION = 'mp4';

  function render(archives) {
    if (!archives) {
      return;
    }

    const bubble = document.querySelector('[for="viewRecordings"]');
    if (!bubble) {
      return;
    }
    bubble.data('recordings', Object.keys(archives).length);

    const list = bubble.querySelector(LIST_SELECTOR);

    list.innerHTML = '';

    const sortingDescending = (a, b) => {
      const tA = archives[a].createdAt;
      const tB = archives[b].createdAt;

      return tB - tA;
    };

    let total = 0;
    Object.keys(archives)
      .sort(sortingDescending)
      .forEach((archiveId) => {
        const archive = archives[archiveId];
        ++total;
        const url = archive.localDownloadURL;
        const item = HTMLElems.createElementAt(list, 'li');

        item.data('status', archive.status);

        HTMLElems.createElementAt(item, 'a', {
          target: '_blank',
          href: `${url}?generatePreview`
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
          download: `${archive.name}.${VIDEO_EXTENSION}`
        }).classList.add('download');
      });

    RoomView.recordingsNumber = total;
  }

  const addHandlers = () => {
    HTMLElems.addHandlerArchive(LIST_SELECTOR);
  };

  const init = (model) => {
    document.body.data('downloadAvailable', Utils.isChrome());
    model.addEventListener('value', render);
    render(model.archives);
    addHandlers();
  };

  exports.RecordingsView = {
    init
  };
})(this);
