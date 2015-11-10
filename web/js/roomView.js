!function(exports) {
  'use strict';

  var PUBLISHER_DIV_ID = 'publisher';

  // HTML elements for the view
  var dock,
      screen,
      handler,
      startChatBtn,
      roomNameElem,
      participantsNumberElem,
      recordingsNumberElem,
      videoSwitch;

  var START_SHARING = 'Share your screen';
  var STOP_SHARING = 'Stop sharing your screen';

  var _videosDisabled = false;

  var NOT_SHARING = {
    detail: {
      isSharing: false
    }
  };

  var currentLayout = null;

  var screenShareCtrEvents = {
    'changeScreenShareStatus': toggleScreenSharing,
    'destroyed': toggleScreenSharing.bind(undefined, NOT_SHARING)
  };

  var roomControllerEvents = {
    'userChangeStatus': function(evt) {
      if (evt.detail.name === 'video') {
        toggleVideoSwitch(false, false);
      }
    }
  };

  function initHTMLElements() {
    dock = document.getElementById('dock');
    screen = document.getElementById('screen');
    handler = dock.querySelector('#handler');

    startChatBtn = dock.querySelector('#startChat');
    roomNameElem = dock.querySelector('#roomName');
    participantsNumberElem = dock.querySelectorAll('.participants');
    recordingsNumberElem = dock.querySelector('#recordings');
    videoSwitch = dock.querySelector('#videoSwitch');
  }

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  function createSubscriberView(streamId, type, controlBtns, name) {
    return currentLayout.append(streamId, type, controlBtns, name);
  }

  function deleteSubscriberView(id) {
    currentLayout.remove(id);
  }

  function toggleVideoSwitch(bubbleUp, status) {
    if (status === undefined) {
      _videosDisabled = !_videosDisabled;
    } else {
      _videosDisabled = status;
    }

    if (_videosDisabled) {
      videoSwitch.classList.add('actived');
    } else {
      videoSwitch.classList.remove('actived');
    }

    bubbleUp && Utils.sendEvent('roomView:videoSwitch', { status: _videosDisabled });
  }

  function toggleChatNotification() {
    if (!ChatView.visible) {
      startChatBtn.classList.add('highlight');
    } else {
      startChatBtn.classList.remove('highlight');
    }
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
        case 'chooseLayout':
          BubbleFactory.get('chooseLayout').toggle();
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
          Utils.sendEvent('roomView:shareScreen');
          break;
        case 'videoSwitch':
          toggleVideoSwitch(true);
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

    Utils.addEventsHandlers('screenShareController:', screenShareCtrEvents, exports);
    Utils.addEventsHandlers('roomController:', roomControllerEvents, exports);
  };

  function toggleScreenSharing(evt) {
    var isSharing = evt.detail.isSharing;
    document.body.dataset.desktopStatus = isSharing ? 'sharing' : 'notSharing';
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

  var addDraggableFeature = function() {
    if (Utils.draggableUI) {
      LazyLoader.dependencyLoad([
        '/js/components/draggable.js'
      ]).then(function() {
        Draggable.init();
      });
    }
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
    addDraggableFeature();
  };

  exports.RoomView = {
    init: init,

    set roomName(value) {
      HTMLElems.addText(roomNameElem, value);
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
    toggleChatNotification: toggleChatNotification
  };

}(this);
