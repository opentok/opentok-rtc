!function(exports) {
  'use strict';

  var PUBLISHER_DIV_ID = 'publisher';

  // HTML elements for the view
  var dock,
      screen,
      handler,
      startChatBtn,
      roomNameElem,
      roomUserElem,
      participantsNumberElem,
      recordingsNumberElem,
      subscribersElem,
      sharingErrors,
      ssInstallSectionError,
      ssTxtSectionError;

  var START_SHARING = 'Share your screen';
  var STOP_SHARING = 'Stop sharing your screen';

  var currentLayout = null;

  var viewEventHandlers = {
    'changeScreenSharingStatus': setScreenSharingStatus
  };

  function initHTMLElements() {
    dock = document.getElementById('dock');
    screen = document.getElementById('screen');
    handler = dock.querySelector('#handler');
    sharingErrors = document.querySelector('.screen-modal');

    ssInstallSectionError = sharingErrors.querySelector('#screenSharingErrorInstall');
    ssTxtSectionError = sharingErrors.querySelector('#screenSharingErrorMsg');

    startChatBtn = dock.querySelector('#startChat');
    roomNameElem = dock.querySelector('#roomName');
    roomUserElem = dock.querySelector('#userName');
    participantsNumberElem = dock.querySelectorAll('.participants');
    recordingsNumberElem = dock.querySelector('#recordings');

    subscribersElem = screen.querySelector('#subscriber');
  }

  var roomNameSuffix = 'Meeting Room';
  var USER_NAME_SUFFIX = '\'s';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  function createSubscriberView(streamId, type, controlBtns) {
    return currentLayout.append(streamId, type, controlBtns);
  }

  function deleteSubscriberView(id) {
    currentLayout.remove(id);
  }

  function toggleChatNotification() {
    if (!ChatView.visible) {
      startChatBtn.classList.add('highlight');
    } else {
      startChatBtn.classList.remove('highlight');
    }
  }

  function changeShareScreenTitle(isSharing) {
    document.body.dataset.desktopStatus = isSharing ? 'sharing' : 'notSharing';
  }

  function getPublisherId() {
    return PUBLISHER_DIV_ID;
  }

  var cronograph = null;

  function getCronograph() {
    if (cronograph) {
      return Promise.resolve(cronograph);
    } else {
      return LazyLoader.dependencyLoad([
        '/js/components/cronograph.js'
      ]).then(function() {
        cronograph = Cronograph;
        return cronograph;
      });
    }
  }

  function onStartArchiving(data) {
    getCronograph().then(function(cronograph) {
      var start = function(archive) {
        var duration = 0;
        archive && (duration = Math.round((Date.now() - archive.createdAt) / 1000));
        cronograph.start(duration);
      };

      var onModel = function(model) {
        var archives = FirebaseModel.archives;
        var archiveId = data.id;

        if (archives) {
          return start(archives[archiveId]);
        }

        FirebaseModel.addEventListener('value', function onValue(archives) {
          FirebaseModel.removeEventListener('value', onValue);
          start(archives[archiveId]);
        });
      };

      var model = RecordingsController.model;

      if (model) {
        cronograph.init();
        return onModel(model);
      }

      cronograph.init('Calculating...');
      exports.addEventListener('recordings-model-ready', function gotModel() {
        exports.removeEventListener('recordings-model-ready', gotModel);
        onModel(RecordingsController.model);
      });
    });
  }

  function onStopArchiving() {
    getCronograph().then(function(cronograph) {
      cronograph.reset();
    });
  }

  var addHandlers = function() {
    handler.addEventListener('click', function(e) {
      dock.classList.toggle('collapsed');
    });

    var menu = document.querySelector('.menu ul');

    menu.addEventListener('click', function(e) {
      var elem = e.target;
      elem.blur();
      switch (elem.id) {
        case 'addToCall':
          BubbleFactory.get('addToCall').toggle();
          break;
        case 'viewRecordings':
          BubbleFactory.get('viewRecordings').toggle();
          break;
        case 'startArchiving':
        case 'stopArchiving':
          Utils.sendEvent('roomView:' + elem.id);
          break;
        case 'startChat':
          ChatView.visible = true;
          toggleChatNotification();
          break;
        case 'endCall':
          RoomView.participantsNumber = 0;
          OTHelper.disconnectFromSession();
          Utils.sendEvent('roomView:endCall');
          break;
        case 'startSharingDesktop':
        case 'stopSharingDesktop':
          Utils.sendEvent('screenSharingView:sharingScreen');
      }
    });

    exports.addEventListener('archiving', function(e) {
      var detail = e.detail;

      switch (detail.status) {
        case 'started':
          onStartArchiving(detail);

          break;
        case 'stopped':
          onStopArchiving();

          break;
      }

      document.body.dataset.archiveStatus = e.detail.status;
    });

    var screenSharingLink = sharingErrors.querySelector('a');
    screenSharingLink.addEventListener('click', function(evt) {
      Utils.sendEvent('screenSharingView:installExtension');
    });

    Utils.addEventsHandlers('roomController:', viewEventHandlers, exports);
  };

  function setScreenSharingStatus(evt) {
    var status = evt.detail;

    if (status.hasError) {
      var errCodes = OTHelper.screenSharingErrorCodes;
      // Only if we really want to differentiate type of errors
      // or show differents section or something like that
      if (status.code === errCodes.accessDenied) {
        showError(status.message);
      } else if (status.code === errCodes.extNotInstalled) {
        showInstallExtension();
      } else {
        showError('Error sharing screen. ' + status.message);
      }
    } else {
      changeShareScreenTitle(status.isSharing);
    }
  }

  function showInstallExtension() {
    ssInstallSectionError.classList.add('visible');
    ssTxtSectionError.classList.remove('visible');
    showSharingScreenError();
  }

  function showError(message) {
    var span = sharingErrors.querySelector('.errTxt');
    ssTxtSectionError.classList.add('visible');
    ssInstallSectionError.classList.remove('visible');
    span.textContent = message;
    showSharingScreenError();
  }

  function showSharingScreenError() {
    return LazyLoader.dependencyLoad([
      '/js/components/modal.js'
    ]).then(function() {
      Modal.show('.screen-modal').then(function(e) {
        sharingErrors.addEventListener('click', function onClose() {
          sharingErrors.removeEventListener('click', onClose);
          Modal.hide('.screen-modal').then(function() {
            ssInstallSectionError.classList.remove('visible');
            ssTxtSectionError.classList.remove('visible');
          });
        });
      });
    });
  }

  var getURLtoShare = function() {
    return window.location.origin + window.location.pathname;
  };

  var addClipboardFeature = function() {
    var input = document.querySelector('.bubble[for="addToCall"] input');
    var linkToShare = document.querySelector('#addToCall');
    input.value = linkToShare.dataset.clipboardText = getURLtoShare();
    var zc = new ZeroClipboard(linkToShare);
  };

  var init = function() {
    initHTMLElements();
    addHandlers();
    // Due to security issues, flash cannot access the clipboard unless the
    // action originates from a click with a flash object.
    // That means that we need to have ZeroClipboard loaded and the URL
    // will be copied once users click on link to share the URL.
    // Programmatically, setText() wouldn't work.
    addClipboardFeature();
    currentLayout = new Grid('.subscribers');
  };

  exports.RoomView = {
    init: init,
    set roomName(value) {
      HTMLElems.addText(roomNameElem, value);
      HTMLElems.createElementAt(roomNameElem, 'p', null, roomNameSuffix);
    },
    set userName(value) {
      roomUserElem.textContent = value + USER_NAME_SUFFIX;
    },

    set participantsNumber(value) {
      for (var i = 0, l = participantsNumberElem.length; i < l; i++) {
        HTMLElems.replaceText(participantsNumberElem[i], value);
      }
    },

    set recordingsNumber(value) {
      recordingsNumberElem && (recordingsNumberElem.textContent = value);
    },

    createSubscriberView: createSubscriberView,
    deleteSubscriberView: deleteSubscriberView,
    publisherId: PUBLISHER_DIV_ID,
    toggleChatNotification: toggleChatNotification,
    setScreenSharingStatus: setScreenSharingStatus
  };

}(this);
