!function(exports) {
  'use strict';

  // HTML elements for the view
  var dock;
  var screen;
  var handler;
  var roomNameElem;
  var participantsNumberElem;
  var participantsStrElem;
  var recordingsNumberElem;
  var videoSwitch;
  var audioSwitch;
  var startChatElem;
  var unreadCountElem;

  var START_SHARING = 'Share your screen';
  var STOP_SHARING = 'Stop sharing your screen';

  var _unreadMsg = 0;
  var _chatHasBeenShown = false;

  var MODAL_TXTS = {
    mute: {
      head: 'To mute all participants, including yourself, click Mute all',
      detail: 'Everyone will be notified and can click their <microphone icon> to unmute ' +
              'themselves.',
      button: 'Mute all'
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
      head: 'All participants are muted',
      detail: 'You can unmute everyone by toggling the Mute all participants option. Or you can ' +
              'unmute just yourself by clicking your <microphone icon> icon',
      button: 'I understand'
    },
    disabledVideos: {
      head: 'Stop receiving video from the other participants, click Stop receiving video',
      detail: 'This option can help to improve or preserve call quality in situations of poor ' +
              'bandwidth or other resource constraints.',
      button: 'Stop receiving video'
    },
    endCall: {
      head: 'Exit the Video Call',
      detail: 'You are going to exit the OpenTok Meeting Room. The call will continue with the ' +
              'remaining participants.',
      button: 'End call'
    },
    sessionDisconnected: {
      head: 'Session disconected',
      detail: 'The connection to the OpenTok platform has been lost. Check your network ' +
              'connectivity and press Reload to connect again.',
      button: 'Reload'
    }
  };

  var NOT_SHARING = {
    detail: {
      isSharing: false
    }
  };

  function setUnreadMessages(count) {
    _unreadMsg = count;
    startChatElem.dataset.unreadMessages = unreadCountElem.textContent = count;
  }

  function setChatStatus(visible) {
    if (visible) {
      _chatHasBeenShown = true;
      setUnreadMessages(0);
      document.body.dataset.chatStatus = 'visible';
    } else {
      document.body.dataset.chatStatus = 'hidden';
    }
    Utils.sendEvent('roomView:chatVisibility', visible);
  }

  var chatViews = {
    'unreadMessage': function(evt) {
      setUnreadMessages(_unreadMsg + 1);
      if (!_chatHasBeenShown) {
        setChatStatus(true);
      }
    }
  };

  var chatEvents = {
    'hidden': function(evt) {
      document.body.dataset.chatStatus = 'hidden';
      setUnreadMessages(0);
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
        setSwitchStatus(false, false, videoSwitch, 'roomView:videoSwitch');
      } else if (evt.detail.name === 'audio') {
        setSwitchStatus(false, false, audioSwitch, 'roomView:muteAllSwitch');
      }
    },
    'roomMuted': function(evt) {
      var isJoining = evt.detail.isJoining;
      setAudioSwitchRemotely(true);
      showConfirm(isJoining ? MODAL_TXTS.join : MODAL_TXTS.muteRemotely);
    },
    'sessionDisconnected': function(evt) {
      RoomView.participantsNumber = 0;
      LayoutManager.removeAll();
      showConfirm(MODAL_TXTS.sessionDisconnected).then(function(hasAccepted) {
        hasAccepted && document.location.reload();
      });
    }
  };

  function setAudioSwitchRemotely(isMuted) {
    setSwitchStatus(isMuted, false, audioSwitch, 'roomView:muteAllSwitch');
  }

  function showConfirmChangeMicStatus(isMuted) {
    return showConfirm(isMuted ? MODAL_TXTS.muteRemotely : MODAL_TXTS.unmutedRemotely);
  }

  function initHTMLElements() {
    dock = document.getElementById('dock');
    screen = document.getElementById('screen');
    handler = dock.querySelector('#handler');

    roomNameElem = dock.querySelector('#roomName');
    participantsNumberElem = dock.querySelectorAll('.participants');
    participantsStrElem = dock.querySelector('.participantsStr');
    recordingsNumberElem = dock.querySelector('#recordings');
    videoSwitch = dock.querySelector('#videoSwitch');
    audioSwitch = dock.querySelector('#audioSwitch');
    startChatElem = dock.querySelector('#startChat');
    unreadCountElem = dock.querySelector('#unreadCount');
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

  function setSwitchStatus(status, bubbleUp, domElem, evtName) {
    var oldStatus = domElem.classList.contains('activated');
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
    bubbleUp && newStatus !== oldStatus && Utils.sendEvent(evtName, { status: newStatus });
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
    function loadModalText() {
      ui.querySelector(' header .msg').textContent = txt.head;
      ui.querySelector(' p.detail').textContent = txt.detail;
      ui.querySelector(' footer button.accept').textContent = txt.button;
    }

    return LazyLoader.dependencyLoad([
        '/js/components/modal.js'
      ]).
      then(function() {
        return Modal.show(selector, loadModalText);
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
        case 'stopChat':
          setChatStatus(elem.id === 'startChat');
          break;
        case 'endCall':
          showConfirm(MODAL_TXTS.endCall).then(function(endCall) {
            if (endCall) {
              RoomView.participantsNumber = 0;
              OTHelper.disconnectFromSession();
              Utils.sendEvent('roomView:endCall');
            }
          });
          break;
        case 'startSharingDesktop':
        case 'stopSharingDesktop':
          Utils.sendEvent('roomView:shareScreen');
          break;
        case 'videoSwitch':
          if (!videoSwitch.classList.contains('activated')) {
            showConfirm(MODAL_TXTS.disabledVideos).then(function(shouldDisable) {
              shouldDisable && setSwitchStatus(true, true, videoSwitch, 'roomView:videoSwitch');
            });
          } else {
            setSwitchStatus(false, true, videoSwitch, 'roomView:videoSwitch');
          }
          break;
        case 'audioSwitch':
          if (!audioSwitch.classList.contains('activated')) {
            showConfirm(MODAL_TXTS.mute).then(function(shouldDisable) {
              shouldDisable &&
                setSwitchStatus(true, true, audioSwitch, 'roomView:muteAllSwitch');
            });
          } else {
            setSwitchStatus(false, true, audioSwitch, 'roomView:muteAllSwitch');
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
    Utils.addEventsHandlers('chat:', chatEvents);
    Utils.addEventsHandlers('chatView:', chatViews);
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
    var config = ZeroClipboard.config();
    var swfObject = document.getElementById(config.swfObjectId);
    var myHoverClass = 'my-zeroclipboard-is-hover';
    swfObject.addEventListener('mouseenter', function(evt) {
      linkToShare.classList.add(myHoverClass);
      swfObject.addEventListener('mouseleave', function onMouseLeave() {
        swfObject.removeEventListener('mouseleave', onMouseLeave);
        linkToShare.classList.remove(myHoverClass);
      });
    });
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
      HTMLElems.replaceText(participantsStrElem, value === 1 ? 'participant' : 'participants');
    },

    set recordingsNumber(value) {
      recordingsNumberElem && (recordingsNumberElem.textContent = value);
    },

    createStreamView: createStreamView,
    deleteStreamView: deleteStreamView,
    setAudioSwitchRemotely: setAudioSwitchRemotely,
    showConfirmChangeMicStatus: showConfirmChangeMicStatus
  };

}(this);
