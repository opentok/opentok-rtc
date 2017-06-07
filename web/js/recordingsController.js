!(function(exports) {
  'use strict';

  var model = null;

  function init(enableArchiveManager, firebaseUrl, firebaseToken, sessionId) {
    var dependenciesLoaded;
    if (enableArchiveManager) {
      dependenciesLoaded = LazyLoader.dependencyLoad([
        '/js/models/firebase.js',
        '/js/recordingsView.js'
      ]).then(function() {
        return FirebaseModel
                  .init(firebaseUrl, firebaseToken);
      });
    } else {
      dependenciesLoaded = Promise.resolve();
    }

    return dependenciesLoaded.then(function(aModel) {
      model = aModel;
      Utils.sendEvent('recordings-model-ready', null, exports);
      addListeners();
      aModel && RecordingsView.init(model);
      EndCallController.init(model, sessionId);
    });
  }

  function onDeleteArchive(data) {
    var previousStatus = data.status;
    data.status = 'deleting';
    Request.deleteArchive(data.id)
      .then(function() {
        Utils.sendEvent('RecordingsController:deleteArchive', { id: data.id });
      })
      .catch(function(error) {
        // Archived couldn't be deleted from server...
        data.status = previousStatus;
      });
  }

  var handlers = {
    delete: function(data) {
      var selector = '.archive-delete-modal';
      function loadModalText() {
        document.querySelector(selector + ' .username').textContent = data.username;
      }
      return Modal.show(selector, loadModalText).then(function() {
        return new Promise(function(resolve, reject) {
          var ui = document.querySelector(selector);
          ui.addEventListener('click', function onClicked(evt) { // eslint-disable-line consistent-return
            var classList = evt.target.classList;
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

  var addListeners = function() {
    exports.addEventListener('archive', function(evt) {
      var handler = handlers[evt.detail.action];
      handler && handler(evt.detail);
    });
  };

  exports.RecordingsController = {
    init: init,
    get model() {
      return model;
    }
  };
}(this));
