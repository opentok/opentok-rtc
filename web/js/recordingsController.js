!function(exports) {
  'use strict';

  var model = null;

  function init(firebaseUrl, firebaseToken) {
    return LazyLoader.dependencyLoad([
      '/js/models/firebase.js',
      '/js/recordingsView.js'
    ]).then(function() {
      FirebaseModel.
        init(firebaseUrl, firebaseToken).
        then(function(aModel) {
          model = aModel;
          Utils.sendEvent('recordings-model-ready', null, exports);
          addListeners();
          RecordingsView.init(model);
        });
    });
  }

  function onDeleteArchive(data) {
    var previousStatus = data.status;
    data.status = 'deleting';
    Request.deleteArchive(data.id).catch(function(error) {
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
          ui.addEventListener('click', function onClicked(evt) {
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

}(this);
