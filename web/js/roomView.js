!(function(exports) {
  'use strict';

  // HTML elements for the view
  var dock;
  var handler;
  var roomNameElem;
  var participantsNumberElem;
  var participantsStrElem;
  var recordingsNumberElem;
  var videoSwitch;
  var audioSwitch;
  var startChatElem;
  var unreadCountElem;
  var enableArchiveManager;

  var _unreadMsg = 0;
  var _chatHasBeenShown = false;

  var MODAL_TXTS = {
    mute: {
      head: 'Mute all participants, including yourself',
      detail: 'Everyone will be notified and can click their <i data-icon="no_mic"></i> to ' +
              'unmute themselves.',
      button: 'Mute all participants'
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
      head: 'Stop receiving video from other participants',
      detail: 'This option can help to improve or preserve call quality in situations of poor ' +
              'bandwidth or other resource constraints.',
      button: 'Stop receiving video'
    },
    endCall: {
      head: 'Exit the Meeting',
      detail: 'You are going to exit the OpenTok Meeting Room. The call will continue with the ' +
              'remaining participants.',
      button: 'End meeting'
    },
    sessionDisconnected: {
      head: 'Session disconected',
      detail: 'The connection to the OpenTok platform has been lost. Check your network ' +
              'connectivity and press Reload to connect again.',
      button: 'Reload'
    },
    chromePublisherError: {
      head: 'Internal Chrome Error',
      detail: 'Failed to acquire microphone. This is a known Chrome bug. Please completely quit ' +
              'and restart your browser.',
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
    unreadCountElem.textContent = count;
    startChatElem.data('unreadMessages', count);
    HTMLElems.flush(startChatElem);
  }

  function setChatStatus(visible) {
    if (visible) {
      _chatHasBeenShown = true;
      setUnreadMessages(0);
      document.body.data('chatStatus', 'visible');
    } else {
      document.body.data('chatStatus', 'hidden');
    }
    Utils.sendEvent('roomView:chatVisibility', visible);
    HTMLElems.flush('#toggleChat');
  }

  var chatViews = {
    unreadMessage: function(evt) {
      setUnreadMessages(_unreadMsg + 1);
      if (!_chatHasBeenShown) {
        setChatStatus(true);
      }
    }
  };

  var chatEvents = {
    hidden: function(evt) {
      document.body.data('chatStatus', 'hidden');
      setUnreadMessages(0);
      HTMLElems.flush('#toggleChat');
    }
  };

  var hangoutEvents = {
    screenOnStage: function(event) {
      var status = event.detail.status;
      if (status === 'on') {
        dock.data('previouslyCollapsed', dock.classList.contains('collapsed'));
        dock.classList.add('collapsed');
      } else if (dock.data('previouslyCollapsed') !== null) {
        dock.data('previouslyCollapsed') === 'true' ? dock.classList.add('collapsed') :
                                                        dock.classList.remove('collapsed');
        dock.data('previouslyCollapsed', null);
      }
    }
  };

  var screenShareCtrEvents = {
    changeScreenShareStatus: toggleScreenSharing,
    destroyed: toggleScreenSharing.bind(undefined, NOT_SHARING),
    annotationStarted: function(evt) {
      document.body.data('annotationVisible', 'true');
    },
    annotationEnded: function(evt) {
      document.body.data('annotationVisible', 'false');
    }
  };

  var roomControllerEvents = {
    userChangeStatus: function(evt) {
      // If user changed the status we need to reset the switch
      if (evt.detail.name === 'video') {
        setSwitchStatus(false, false, videoSwitch, 'roomView:videoSwitch');
      } else if (evt.detail.name === 'audio') {
        setSwitchStatus(false, false, audioSwitch, 'roomView:muteAllSwitch');
      }
    },
    roomMuted: function(evt) {
      var isJoining = evt.detail.isJoining;
      setAudioSwitchRemotely(true);
      showConfirm(isJoining ? MODAL_TXTS.join : MODAL_TXTS.muteRemotely);
    },
    sessionDisconnected: function(evt) {
      RoomView.participantsNumber = 0;
      LayoutManager.removeAll();
    },
    controllersReady: function() {
      var elements = dock.querySelectorAll('.menu [disabled]');
      Array.prototype.forEach.call(elements, function(element) {
        Utils.setDisabled(element, false);
      });
    },
    annotationStarted: function(evt) {
      document.body.data('annotationVisible', 'true');
    },
    annotationEnded: function(evt) {
      document.body.data('annotationVisible', 'false');
    },
    chromePublisherError: function(evt) {
      showConfirm(MODAL_TXTS.chromePublisherError).then(function() {
        document.location.reload();
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
    handler = dock.querySelector('#handler');

    roomNameElem = dock.querySelector('#roomName');
    participantsNumberElem = dock.querySelectorAll('.participants');
    participantsStrElem = dock.querySelector('.participantsStr');
    recordingsNumberElem = dock.querySelector('#recordings');
    videoSwitch = dock.querySelector('#videoSwitch');
    audioSwitch = dock.querySelector('#audioSwitch');
    startChatElem = dock.querySelector('#startChat');
    unreadCountElem = dock.querySelector('#unreadCount');

    // The title takes two lines maximum when the dock is expanded. When the title takes
    // one line with expanded mode, it ends taking two lines while is collapsing because the witdh
    // is reduced, so we have to fix the height to avoid this ugly effect during transition.
    var title = dock.querySelector('.info h1');
    title.style.height = title.clientHeight + 'px';
  }

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
    }
    return LazyLoader.dependencyLoad([
      '/js/components/cronograph.js'
    ]).then(function() {
      cronograph = Cronograph;
      return cronograph;
    });
  }

  function onStartArchiving(data) {
    getCronograph().then(function(cronograph) { // eslint-disable-line consistent-return
      var start = function(archive) {
        var duration = 0;
        archive && (duration = Math.round((Date.now() - archive.createdAt) / 1000));
        cronograph.start(duration);
      };

      if (!enableArchiveManager) {
        cronograph.init();
        return start(null);
      }

      var onModel = function(model) { // eslint-disable-line consistent-return
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
      ui.querySelector(' p.detail').innerHTML = txt.detail;
      ui.querySelector(' footer button.accept').textContent = txt.button;
    }

    return Modal.show(selector, loadModalText)
      .then(function() {
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
            Modal.hide(selector).then(function() { resolve(hasAccepted); });
          });
        });
      });
  }

  var addHandlers = function() {
    handler.addEventListener('click', function(e) {
      dock.classList.toggle('collapsed');
      dock.data('previouslyCollapsed', null);
    });

    var menu = document.querySelector('.menu ul');

    menu.addEventListener('click', function(e) {
      var elem = e.target;
      elem.blur();
      // pointer-events is not working on IE so we can receive as target a child
      elem = HTMLElems.getAncestorByTagName(elem, 'a');
      if (!elem) {
        return;
      }
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

      document.body.data('archiveStatus', e.detail.status);
      HTMLElems.flush(['#toggleArchiving', '[data-stream-type=publisher] [data-icon="record"]']);
    });

    Utils.addEventsHandlers('screenShareController:', screenShareCtrEvents, exports);
    Utils.addEventsHandlers('roomController:', roomControllerEvents, exports);
    Utils.addEventsHandlers('chat:', chatEvents);
    Utils.addEventsHandlers('chatView:', chatViews);
    Utils.addEventsHandlers('hangout:', hangoutEvents);
  };

  function toggleScreenSharing(evt) {
    var isSharing = evt.detail.isSharing;
    document.body.data('desktopStatus', isSharing ? 'sharing' : 'notSharing');
    HTMLElems.flush('#toggleSharing');
  }

  var getURLtoShare = function() {
    return window.location.origin + window.location.pathname;
  };

  var addClipboardFeature = function() {
    var input = document.querySelector('.bubble[for="addToCall"] input');
    var urlToShare = getURLtoShare();
    input.value = urlToShare;
    var clipboard = new Clipboard(document.querySelector('#addToCall'), { // eslint-disable-line no-unused-vars
      text: function() {
        return urlToShare;
      }
    });
  };

  var init = function(enableHangoutScroll, aEnableArchiveManager) {
    enableArchiveManager = aEnableArchiveManager;
    initHTMLElements();
    addHandlers();
    addClipboardFeature();
    LayoutManager.init('.streams', enableHangoutScroll);
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
}(this));
