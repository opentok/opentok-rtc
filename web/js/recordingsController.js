/* global Modal, ArchivesEventsListener, RecordingsView */

!((exports) => {
  let model = null;

  const addListeners = () => {
    exports.addEventListener('archive', (evt) => {
      const handler = handlers[evt.detail.action];
      handler && handler(evt.detail);
    });
  };

  function init(enableArchiveManager, existingArchives) {
    let dependenciesLoaded;
    if (enableArchiveManager) {
      dependenciesLoaded = LazyLoader.dependencyLoad([
        '/js/models/archivesEventsListener.js',
        '/js/min/recordingsView.min.js',
      ]).then(() => ArchivesEventsListener
        .init());
    } else {
      dependenciesLoaded = Promise.resolve();
    }

    return dependenciesLoaded.then((aModel) => {
      model = aModel;
      model.archives = existingArchives;
      Utils.sendEvent('recordings-model-ready', null, exports);
      addListeners();
      aModel && RecordingsView.init(model);
    });
  }

  function onDeleteArchive(data) {
    const previousStatus = data.status;
    data.status = 'deleting';
    Request.deleteArchive(data.id)
      .then(() => {
        Utils.sendEvent('RecordingsController:deleteArchive', { id: data.id });
      })
      .catch(() => {
        // Archived couldn't be deleted from server...
        data.status = previousStatus;
      });
  }

  const handlers = {
    delete(data) {
      const selector = '.archive-delete-modal';
      function loadModalText() {
        document.querySelector(`${selector} .username`).textContent = data.username;
      }
      return Modal.show(selector, loadModalText).then(() => new Promise(() => {
        const ui = document.querySelector(selector);
        ui.addEventListener('click', function onClicked(evt) { // eslint-disable-line consistent-return
          const { classList } = evt.target;
          evt.stopImmediatePropagation();
          evt.preventDefault();

          (classList.contains('delete-archive')) && onDeleteArchive(data);

          if (classList.contains('btn')) {
            ui.removeEventListener('click', onClicked);
            return Modal.hide(selector);
          }
        });
      }));
    },
  };

  exports.RecordingsController = {
    init,
    get model() {
      return model;
    },
  };
})(this);
