!function(exports) {
  'use strict';

  var DESKTOP_DIV_ID = 'desktop';
  var container = null;

  var shareError;
  var installSectionError;
  var txtSectionError;
  var extInstallationSuccessful;

  var screenShareCtrlEvents = {
    'shareScreenError': launchShareError,
    'extInstallationResult': extInstallationResult
  };

  function init() {
    container = document.querySelector('.' + DESKTOP_DIV_ID);
    shareError = document.querySelector('.screen-modal');
    installSectionError = shareError.querySelector('#screenShareErrorInstall');
    txtSectionError = shareError.querySelector('#screenShareErrorMsg');
    extInstallationSuccessful = shareError.querySelector('#extInstallationSuccessful');

    var installLink = shareError.querySelector('a');
    installLink.addEventListener('click', function(evt) {
      Utils.sendEvent('screenShareView:installExtension');
    });
    Utils.addEventsHandlers('screenShareController:', screenShareCtrlEvents, exports);
  };

  function launchShareError(evt) {
    // Remove stream
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    var status = evt.detail;
    var errCodes = OTHelper.screenShareErrorCodes;
    // Only if we really want to differentiate type of errors
    // or show differents section or something like that
    if (status.code === errCodes.accessDenied) {
      showError(status.message);
    } else if (status.code === errCodes.extNotInstalled) {
      showInstallExtension();
    } else {
      showError('Error sharing screen. ' + status.message);
    }
  }

  function showInstallExtension() {
    installSectionError.classList.add('visible');
    txtSectionError.classList.remove('visible');
    extInstallationSuccessful.classList.remove('visible');
    showShareScreenError();
  }

  function showError(message) {
    var span = shareError.querySelector('.errTxt');
    txtSectionError.classList.add('visible');
    installSectionError.classList.remove('visible');
    extInstallationSuccessful.classList.remove('visible');
    span.textContent = message;
    showShareScreenError();
  }

  function extInstallationResult(evt) {
    var status = evt.detail;
    if (status.error) {
      showError("Error installation extension. " + status.message);
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

    installSectionError.classList.remove('visible');
    txtSectionError.classList.remove('visible');
    extInstallationSuccessful.classList.add('visible');

    showShareScreenError();
  }

  function hideShareScreenError() {
    shareError.removeEventListener('click', hideShareScreenError);
    Modal.hide('.screen-modal').then(function() {
      installSectionError.classList.remove('visible');
      txtSectionError.classList.remove('visible');
      extInstallationSuccessful.classList.remove('visible');
    });
  }

  function showShareScreenError() {
    return LazyLoader.dependencyLoad([
      '/js/components/modal.js'
    ]).then(function() {
      Modal.show('.screen-modal').then(function(e) {
        shareError.addEventListener('click', hideShareScreenError);
      });
    });
  }

  exports.ScreenShareView = {
    desktopId: DESKTOP_DIV_ID,
    init: init
  };

}(this);
