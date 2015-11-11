!function(exports) {
  'use strict';

  var shareError;

  var screenShareCtrlEvents = {
    'shareScreenError': launchShareError,
    'extInstallationResult': extInstallationResult,
    'destroyed': destroyView
  };

  function destroyView() {
    RoomView.deleteStreamView('desktop');
  }

  function init() {
    shareError = document.querySelector('.screen-modal');

    var installLink = shareError.querySelector('#screenShareErrorInstall button');
    installLink.addEventListener('click', function(evt) {
      hideShareScreenError();
      Utils.sendEvent('screenShareView:installExtension');
    });
    Utils.addEventsHandlers('screenShareController:', screenShareCtrlEvents, exports);
  };

  function launchShareError(evt) {
    destroyView();

    var status = evt.detail;
    var errCodes = OTHelper.screenShareErrorCodes;
    // Only if we really want to differentiate type of errors
    // or show differents section or something like that
    if (status.code === errCodes.accessDenied) {
      showError('Error', status.message);
    } else if (status.code === errCodes.extNotInstalled) {
      showInstallExtension();
    } else {
      showError('Sharing screen failed.', status.message);
    }
  }

  function showInstallExtension() {
    showShareScreenError('error-installing');
  }

  function showError(title, description) {
    shareError.querySelector('.errorTitle').textContent = title;
    shareError.querySelector('.errorDescription').textContent = description;
    showShareScreenError('error-sharing');
  }

  function extInstallationResult(evt) {
    var status = evt.detail;
    if (status.error) {
      showError('Installation failed.', status.message);
    } else {
      showInstallationSuccess();
    }
  }

  function showInstallationSuccess() {
    var btnCancel = shareError.querySelector('#scrShrLater');
    var btnReload = shareError.querySelector('#scrShrReload');

    btnCancel.addEventListener('click', function btnCancelReload(evt) {
      btnCancel.removeEventListener('click', btnCancelReload);
      hideShareScreenError();
    });

    btnReload.addEventListener('click', function btnConfirmReload(evt) {
      btnReload.removeEventListener('click', btnConfirmReload);
      document.location.reload(true);
    });

    showShareScreenError('successful-installation');
  }

  function onClick(e) {
    if (e.target.id !== 'screenShareErrors') {
      return;
    }

    hideShareScreenError();
  }

  function hideShareScreenError(e) {
    shareError.removeEventListener('click', onClick);
    Modal.hide('.screen-modal').then(function() {
      delete shareError.dataset.screenSharingType;
    });
  }

  function showShareScreenError(type) {
    shareError.dataset.screenSharingType = type;
    return LazyLoader.dependencyLoad([
      '/js/components/modal.js'
    ]).then(function() {
      Modal.show('.screen-modal').then(function(e) {
        shareError.addEventListener('click', onClick);
      });
    });
  }

  exports.ScreenShareView = {
    init: init
  };

}(this);
