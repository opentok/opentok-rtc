/* global Modal, FirebaseModel, RecordingsView */

!(exports => {
  let model = null;

  function init(enableArchiveManager) {
    let dependenciesLoaded;
    if (enableArchiveManager) {
      dependenciesLoaded = LazyLoader.dependencyLoad([
        '/js/models/firebase.js',
        '/js/recordingsView.js'
      ]).then(() => {
        return FirebaseModel
          .init();
      });
    } else {
      dependenciesLoaded = Promise.resolve();
    }

    return dependenciesLoaded.then(aModel => {
      model = aModel;
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
      return Modal.show(selector, loadModalText).then(() => {
        return new Promise(() => {
          const ui = document.querySelector(selector);
          ui.addEventListener('click', function onClicked(evt) { // eslint-disable-line consistent-return
            const classList = evt.target.classList;
            evt.stopImmediatePropagation();
            evt.preventDefault();

            (classList.contains('delete-archive')) && onDeleteArchive(data);

            if (classList.contains('btn')) {
              ui.removeEventListener('click', onClicked);
              return Modal.hide(selector);
            }
          });
        });
      });
    }
  };

  var addListeners = () => {
    exports.addEventListener('archive', evt => {
      const handler = handlers[evt.detail.action];
      handler && handler(evt.detail);
    });
  };

  exports.RecordingsController = {
    init,
    get model() {
      return model;
    }
  };
})(this);
