!function(exports) {
  'use strict';

  // HTML elements for the view
  var dock;
  var screen;
  var handler;
  var startChatBtn;
  var roomNameElem;
  var participantsNumberElem;
  var recordingsNumberElem;
  var videoSwitch;
  var audioSwitch;

  var START_SHARING = 'Share your screen';
  var STOP_SHARING = 'Stop sharing your screen';

  var MODAL_TXTS = {
    mute: {
      head: 'All participants microphones are going to be disabled in the call',
      detail: 'If someone with to keep talking, ' +
              'they must enable manually its own microphone',
      button: 'Mute All'
    },
    muteRemotely: {
      head: 'All participants microphones are going to be disabled in the call',
      detail: 'If you want to keep talking , ' +
              'you must enable manually your own microphone',
      button: 'I understand'
    },
    unmutedRemotely: {
      head: 'Your microphone is going to be enabled in the call',
      detail: 'If you want to keep muted , ' +
              'you must disable manually your own microphone',
      button: 'I understand'
    },
    join: {
      head: 'You are joining a call with all participants muted',
      detail: 'If you want to unmute yourself, ' +
              'just press the mic icon in the bottom of your video.',
      button: 'I understand'
    },
    disabledVideos: {
      head: 'Unsubscribe from all videos',
      detail: 'Disable all videos to decrease internet usage and increase audio quiality',
      button: 'Disable All'
    }
  };

  var NOT_SHARING = {
    detail: {
      isSharing: false
    }
  };

  var screenShareCtrEvents = {
    'changeScreenShareStatus': toggleScreenSharing,
    'destroyed': toggleScreenSharing.bind(undefined, NOT_SHARING)
  };

  var roomControllerEvents = {
    'userChangeStatus': function(evt) {
      // If user changed the status we need to reset the switch
      if (evt.detail.name === 'video') {
        toggleSwitch(false, videoSwitch, 'roomView:videoSwitch', false);
      } else if (evt.detail.name === 'audio') {
        toggleSwitch(false, audioSwitch, 'roomView:muteAllSwitch', false);
      }
    },
    'roomMuted': function(evt) {
      var isJoining = evt.detail.isJoining;
      setAudioSwitchRemotely(true);
      showConfirm(isJoining ? MODAL_TXTS.join : MODAL_TXTS.muteRemotely);
    }
  };

  function setAudioSwitchRemotely(isMuted) {
    toggleSwitch(false, audioSwitch, 'roomView:muteAllSwitch', isMuted);
  }

  function showConfirmChangeMicStatus(isMuted) {
    return showConfirm(isMuted ? MODAL_TXTS.muteRemotely : MODAL_TXTS.unmutedRemotely);
  }

  function initHTMLElements() {
    dock = document.getElementById('dock');
    screen = document.getElementById('screen');
    handler = dock.querySelector('#handler');

    startChatBtn = dock.querySelector('#startChat');
    roomNameElem = dock.querySelector('#roomName');
    participantsNumberElem = dock.querySelectorAll('.participants');
    recordingsNumberElem = dock.querySelector('#recordings');
    videoSwitch = dock.querySelector('#videoSwitch');
    audioSwitch = dock.querySelector('#audioSwitch');
  }

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  function createStreamView(streamId, type, controlBtns, name) {
    return LayoutManager.append(streamId, type, controlBtns, name);
  }

  function deleteStreamView(id) {
    LayoutManager.remove(id);
  }

  function toggleSwitch(bubbleUp, domElem, evtName, status) {
    var newStatus;
    if (status === undefined) {
      newStatus = domElem.classList.toggle('activated');
    } else {
      newStatus = status;
      if (status) {
        domElem.classList.add('activated');
      } else {
        domElem.classList.remove('activated');
      }
    }
    bubbleUp && Utils.sendEvent(evtName, { status: newStatus });
  }

  function toggleChatNotification() {
    if (!ChatView.visible) {
      startChatBtn.classList.add('highlight');
    } else {
      startChatBtn.classList.remove('highlight');
    }
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

  function showConfirm(txt) {
    var selector = '.switch-alert-modal';
    var ui = document.querySelector(selector);
    ui.querySelector(' header .msg').textContent = txt.head;
    ui.querySelector(' p.detail').textContent = txt.detail;
    ui.querySelector(' footer button.accept').textContent = txt.button;

    return LazyLoader.dependencyLoad([
        '/js/components/modal.js'
      ]).
      then(function() {
        return Modal.show(selector);
      }).
      then(function() {
        return new Promise(function(resolve, reject) {
          ui.addEventListener('click', function onClicked(evt) {
            var classList = evt.target.classList;
            var hasAccepted = classList.contains('accept');
            if (evt.target.id !== 'switchAlerts' && !hasAccepted && !classList.contains('close')) {
              return;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();
            ui.removeEventListener('click', onClicked);
            Modal.hide(selector);
            resolve(hasAccepted);
          });
        });
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
          if (!videoSwitch.classList.contains('activated')) {
            showConfirm(MODAL_TXTS.disabledVideos).
              then(toggleSwitch.bind(undefined, true, videoSwitch, 'roomView:videoSwitch'));
          } else {
            toggleSwitch(true, videoSwitch, 'roomView:videoSwitch');
          }
          break;
        case 'audioSwitch':
          if (!audioSwitch.classList.contains('activated')) {
            showConfirm(MODAL_TXTS.mute).then(function(hasAccepted) {
              hasAccepted && toggleSwitch(true, audioSwitch, 'roomView:muteAllSwitch');
            });
          } else {
            toggleSwitch(true, audioSwitch, 'roomView:muteAllSwitch');
          }
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

  var init = function() {
    initHTMLElements();
    addHandlers();
    // Due to security issues, flash cannot access the clipboard unless the
    // action originates from a click with a flash object.
    // That means that we need to have ZeroClipboard loaded and the URL
    // will be copied once users click on link to share the URL.
    // Programmatically, setText() wouldn't work.
    addClipboardFeature();
    LayoutManager.init('.streams');
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

    createStreamView: createStreamView,
    deleteStreamView: deleteStreamView,
    toggleChatNotification: toggleChatNotification,
    setAudioSwitchRemotely: setAudioSwitchRemotely,
    showConfirmChangeMicStatus: showConfirmChangeMicStatus
  };

}(this);
