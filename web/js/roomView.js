/* global RoomView, Cronograph, ArchivesEventsListener, RecordingsController, Modal,
BubbleFactory, LayoutManager, $, maxUsersPerRoom */

!(exports => {
  // HTML elements for the view
  let dock;
  let handler;
  let callControlsElem;
  let feedbackButton;
  let togglePublisherVideoElem;
  let togglePublisherAudioElem;
  let startArchivingElem;
  let stopArchivingElem;
  let annotateBtnElem;
  let manageRecordingsElem;
  let messageButtonElem;
  let participantsStrElem;
  let recordingsNumberElem;
  let videoSwitch;
  let audioSwitch;
  let topBannerElem;
  let screenElem;
  let unreadCountElem;
  let enableArchiveManager;
  let enableSip;
  let hideCallControlsTimer;
  let hideFeedbackButtonTimer;
  let overCallControls = false;
  let overFeedbackButton = false;

  let _unreadMsg = 0;
  let _chatHasBeenShown = false;
  let chatVisible = false;

  const MODAL_TXTS = {
    mute: {
      head: 'Mute all participants, including yourself',
      detail: 'Everyone will be notified and can click their <i data-icon="no_mic"></i> button' +
              ' to unmute themselves.',
      button: 'Mute all participants'
    },
    muteRemotely: {
      head: 'All participants microphones are being disabled in the call',
      detail: 'If you want to keep talking, ' +
              'you must manually enable your own microphone.',
      button: 'I understand'
    },
    unmutedRemotely: {
      head: 'Your microphone is now enabled in the call',
      detail: 'If you want to remain muted, ' +
              'you must manually disable your own microphone.',
      button: 'I understand'
    },
    join: {
      head: 'All participants are muted',
      detail: 'You can unmute everyone by toggling the Mute all participants option. Or you can ' +
              'unmute just yourself by clicking the microphone icon in the bottom menu.',
      button: 'I understand'
    },
    lock: {
      head: 'Do you want to lock the meeting?',
      detail: 'When a meeting room is locked, no one else will be allowed to join the meeting. ' +
              'Current participants who leave the meeting will not be allowed back in.',
      button: 'Lock Meeting'
    },
    endCall: {
      head: 'Do you want to leave the meeting?',
      detail: 'The meeting will continue with the remaining participants.',
      button: 'Leave meeting'
    },
    endLockedCall: {
      head: 'Do you want to unlock the meeting before leaving?',
      detail: 'The meeting will continue with the remaining participants. When a meeting room is locked, no one else will be allowed to join or re-join the meeting.',
      button: 'Unlock and Leave',
      altButton: 'Leave Without Unlocking'
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
    },
    meetingFullError: {
      head: 'Meeting Full',
      detail: `This meeting has reached the full capacity of ${window.maxUsersPerRoom} participants. Try&nbsp;joining later.`,
      button: 'OK'
    }
  };

  const NOT_SHARING = {
    detail: {
      isSharing: false
    }
  };

  function setUnreadMessages(count) {
    if (!chatVisible) {
      _unreadMsg = count;
      unreadCountElem.textContent = (count === 0) ? '' : `(${count})`;
    }
  }

  function setChatStatus(visible) {
    chatVisible = visible;
    if (visible) {
      _chatHasBeenShown = true;
      setUnreadMessages(0);
      messageButtonElem.classList.add('activated');

      // hide call controls on small screens
      if (window.innerWidth <= 480) {
        hideCallControls();
      }
    } else {
      messageButtonElem.classList.remove('activated');
    }
    Utils.sendEvent('roomView:chatVisibility', visible);
  }

  const chatViews = {
    unreadMessage() {
      if (!_chatHasBeenShown) {
        setChatStatus(true);
      }
      setUnreadMessages(_unreadMsg + 1);
    },
    hidden() {
      Utils.sendEvent('roomView:screenChange');
    },
    shown() {
      Utils.sendEvent('roomView:screenChange');
    }
  };

  const chatEvents = {
    hidden() {
      document.body.data('chatStatus', 'hidden');
      messageButtonElem.classList.remove('activated');
      setUnreadMessages(0);
    }
  };

  const hangoutEvents = {
    screenOnStage(event) {
      const status = event.detail.status;
      if (status === 'on') {
        dock.data('previouslyCollapsed', dock.classList.contains('collapsed'));
        dock.classList.add('collapsed');
      } else if (dock.data('previouslyCollapsed') !== null) {
        dock.data('previouslyCollapsed') === 'true' ? dock.classList.add('collapsed') :
          dock.classList.remove('collapsed');
        dock.data('previouslyCollapsed', null);
      }
    },
    rearranged() {
      Utils.sendEvent('roomView:screenChange');
    }
  };

  const screenShareCtrEvents = {
    changeScreenShareStatus: toggleScreenSharing,
    destroyed: toggleScreenSharing.bind(undefined, NOT_SHARING),
    annotationStarted() {
      Utils.setDisabled(annotateBtnElem, false);
    },
    annotationEnded() {
      document.body.data('annotationVisible', 'false');
      Utils.setDisabled(annotateBtnElem, true);
    }
  };

  const roomControllerEvents = {
    userChangeStatus(evt) {
      // If user changed the status we need to reset the switch
      if (evt.detail.name === 'video') {
        setSwitchStatus(false, false, videoSwitch, 'roomView:videoSwitch');
      } else if (evt.detail.name === 'audio') {
        setSwitchStatus(false, false, audioSwitch, 'roomView:muteAllSwitch');
      }
    },
    roomLocked(evt) {
      const lockState = evt.detail;
      RoomView.lockState = lockState;
      const menuLockIcon = document.getElementById('lock-room-icon');
      const menuLockText = document.getElementById('lock-msg');
      const navBarStateIcon = document.getElementById('room-locked-state');

      if (lockState === 'locked') {
        menuLockText.innerHTML = 'Unlock Meeting';
        menuLockIcon.setAttribute('data-icon', 'closedLock');
        navBarStateIcon.style.display = 'block';
      }
      if (lockState === 'unlocked') {
        menuLockText.innerHTML = 'Lock Meeting';
        menuLockIcon.setAttribute('data-icon', 'openLock');
        navBarStateIcon.style.display = 'none';

        Modal.flashMessage('.room-unlocked-modal');
      }
    },
    roomMuted(evt) {
      const isJoining = evt.detail.isJoining;
      setAudioSwitchRemotely(true);
      Modal.showConfirm(isJoining ? MODAL_TXTS.join : MODAL_TXTS.muteRemotely);
    },
    sessionDisconnected() {
      RoomView.participantsNumber = 0;
      LayoutManager.removeAll();
    },
    controllersReady() {
      const selectorStr = '#top-banner [disabled], .call-controls [disabled]'
        + ':not(#toggle-publisher-video):not(#toggle-publisher-audio)'
        + ':not(#annotate)';
      const elements = document.querySelectorAll(selectorStr);
      Array.prototype.forEach.call(elements, element => {
        Utils.setDisabled(element, false);
      });
    },
    annotationStarted() {
      Utils.setDisabled(annotateBtnElem, false);
    },
    annotationEnded() {
      document.body.data('annotationVisible', 'false');
      Utils.setDisabled(annotateBtnElem, true);
    },
    chromePublisherError() {
      Modal.showConfirm(MODAL_TXTS.chromePublisherError).then(() => {
        document.location.reload();
      });
    },
    meetingFullError() {
      Modal.showConfirm(MODAL_TXTS.meetingFullError).then(() => {
        document.location.reload();
      });
    }
  };

  function setAudioSwitchRemotely(isMuted) {
    isMuted ?
      setPublisherAudioSwitchStatus('muted') :
      setPublisherAudioSwitchStatus('activated');
  }

  function showConfirmChangeMicStatus(isMuted) {
    if (isMuted) {
        setPublisherAudioSwitchStatus('muted');
      }
    return Modal.showConfirm(isMuted ? MODAL_TXTS.muteRemotely : MODAL_TXTS.unmutedRemotely);
  }

  function initHTMLElements() {
    dock = document.getElementById('top-banner');
    handler = dock;
    callControlsElem = document.querySelector('.call-controls');
    feedbackButton = document.querySelector('.feedbackButton');
    participantsStrElem = document.getElementById('participantsStr');
    recordingsNumberElem = dock.querySelector('#recordings');
    videoSwitch = dock.querySelector('#videoSwitch');
    audioSwitch = dock.querySelector('#audioSwitch');
    unreadCountElem = document.getElementById('unreadCount');
    togglePublisherAudioElem = document.getElementById('toggle-publisher-audio');
    togglePublisherVideoElem = document.getElementById('toggle-publisher-video');
    startArchivingElem = document.getElementById('startArchiving');
    stopArchivingElem = document.getElementById('stopArchiving');
    annotateBtnElem = document.getElementById('annotate');
    manageRecordingsElem = document.getElementById('manageRecordings');
    messageButtonElem = document.getElementById('message-btn');
    topBannerElem = document.getElementById('top-banner');
    screenElem = document.getElementById('screen');

    // The title takes two lines maximum when the dock is expanded. When the title takes
    // one line with expanded mode, it ends taking two lines while is collapsing because the witdh
    // is reduced, so we have to fix the height to avoid this ugly effect during transition.
    // var title = dock.querySelector('.info h1');
    // title.style.height = title.clientHeight + 'px';
  }

  function createStreamView(streamId, type, controlBtns, name) {
    return LayoutManager.append(streamId, type, controlBtns, name);
  }

  function deleteStreamView(id) {
    LayoutManager.remove(id);
  }

  function showRoom() {
    initHTMLElements();
    topBannerElem.style.visibility = 'visible';
    screenElem.style.visibility = 'visible';
    screenElem.addEventListener('mousemove', showControls);
    callControlsElem.addEventListener('mouseover', () => {
      clearTimeout(hideCallControlsTimer);
      overCallControls = true;
    });
    callControlsElem.addEventListener('mouseout', () => {
      overCallControls = false;
      hideCallControls();
    });
    feedbackButton && feedbackButton.addEventListener('mouseover', () => {
      clearTimeout(hideFeedbackButtonTimer);
      overFeedbackButton = true;
    });
    feedbackButton && feedbackButton.addEventListener('mouseout', () => {
      overFeedbackButton = false;
      hideFeedbackButton();
    });
  }

  function showControls() {
    showCallControls();
    showFeedbackButton();
  }

  function showCallControls() {
    callControlsElem.classList.add('visible');
    if (!overCallControls && !hideCallControlsTimer) {
      hideCallControlsTimer = setTimeout(hideCallControls, 3000);
    }
  }

  function hideCallControls() {
    hideCallControlsTimer = null;
    callControlsElem.classList.remove('visible');
  }

  function showFeedbackButton() {
    if (!feedbackButton) {
      return;
    }
    feedbackButton.classList.add('visible');
    if (!overFeedbackButton && !hideFeedbackButtonTimer) {
      hideFeedbackButtonTimer = setTimeout(hideFeedbackButton, 3000);
    }
  }

  function hideFeedbackButton() {
    hideFeedbackButtonTimer = null;
    feedbackButton.classList.remove('visible');
  }


  function showPublisherButtons(publisherOptions) {
    Utils.setDisabled(togglePublisherVideoElem, false);
    Utils.setDisabled(togglePublisherAudioElem, false);
    if (publisherOptions.publishVideo) {
      togglePublisherVideoElem.classList.add('activated');
      togglePublisherVideoElem.querySelector('i').data('icon', 'video_icon');
    }
    if (publisherOptions.publishAudio) {
      setPublisherAudioSwitchStatus('activated');
    }
  }

  function setSwitchStatus(status, bubbleUp, domElem, evtName) {
    const oldStatus = domElem.classList.contains('activated');
    let newStatus;
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

  function setPublisherAudioSwitchStatus(status) {
    if (status === 'activated') {
      togglePublisherAudioElem.classList.add('activated');
      togglePublisherAudioElem.querySelector('i').data('icon', 'mic');
    } else {
      togglePublisherAudioElem.classList.remove('activated');
      togglePublisherAudioElem.querySelector('i').data('icon', 'mic-muted');
    }
  }

  let cronograph = null;

  function getCronograph() {
    if (cronograph) {
      return Promise.resolve(cronograph);
    }
    return LazyLoader.dependencyLoad([
      '/js/components/cronograph.js'
    ]).then(() => {
      cronograph = Cronograph;
      return cronograph;
    });
  }

  function onStartArchiving(data) {
    getCronograph().then(cronograph => { // eslint-disable-line consistent-return
      const start = archive => {
        let duration = 0;
        archive && (duration = Math.round((Date.now() - archive.createdAt) / 1000));
        cronograph.start(duration);
        startArchivingElem.style.display = 'none';
        stopArchivingElem.style.display = 'block';
        manageRecordingsElem.classList.add('recording');
      };

      if (!enableArchiveManager) {
        cronograph.init();
        return start(null);
      }

      const onModel = () => { // eslint-disable-line consistent-return
        var archives = ArchivesEventsListener.archives;
        var archiveId = data.id;

        if (archives) {
          return start(archives[archiveId]);
        }

        ArchivesEventsListener.addEventListener('value', function onValue(archives) {
          ArchivesEventsListener.removeEventListener('value', onValue);
          start(archives[archiveId]);
        });
      };

      const model = RecordingsController.model;

      if (model) {
        cronograph.init();
        return onModel(model);
      }

      cronograph.init('Recording');
      exports.addEventListener('recordings-model-ready', function gotModel() {
        exports.removeEventListener('recordings-model-ready', gotModel);
        onModel(RecordingsController.model);
      });
    });
  }

  function onStopArchiving() {
    getCronograph().then(cronograph => {
      stopArchivingElem.style.display = 'none';
      startArchivingElem.style.display = 'inline-block';
      manageRecordingsElem.classList.remove('recording');
      cronograph.stop();
    });
  }

  const addHandlers = () => {
    handler.addEventListener('click', () => {
      dock.classList.toggle('collapsed');
      dock.data('previouslyCollapsed', null);
    });

    callControlsElem.addEventListener('click', e => {
      let elem = e.target;
      elem = HTMLElems.getAncestorByTagName(elem, 'button');
      if (elem === null) {
        return;
      }
      switch (elem.id) {
        case 'addToCall': {
          Utils.sendEvent('roomView:addToCall');
          break;
        }
        case 'toggle-publisher-video': {
          let hasVideo;
          if (elem.classList.contains('activated')) {
            elem.classList.remove('activated');
            elem.querySelector('i').data('icon', 'no_video');
            hasVideo = false;
          } else {
            elem.classList.add('activated');
            elem.querySelector('i').data('icon', 'video_icon');
            hasVideo = true;
          }
          Utils.sendEvent('roomView:togglePublisherVideo', { hasVideo });
          break;
        }
        case 'toggle-publisher-audio': {
          let hasAudio;
          if (elem.classList.contains('activated')) {
            elem.classList.remove('activated');
            elem.querySelector('i').data('icon', 'mic-muted');
            hasAudio = false;
          } else {
            elem.classList.add('activated');
            elem.querySelector('i').data('icon', 'mic');
            hasAudio = true;
          }
          Utils.sendEvent('roomView:togglePublisherAudio', { hasAudio });
          break;
        }
        case 'screen-share': {
          Utils.sendEvent('roomView:shareScreen');
          break;
        }
        case 'annotate': {
          document.body.data('annotationVisible') === 'true' ?
            document.body.data('annotationVisible', 'false') : document.body.data('annotationVisible', 'true');
          Utils.sendEvent('roomView:screenChange');
          break;
        }
        case 'message-btn': {
          setChatStatus(!messageButtonElem.classList.contains('activated'));
          break;
        }
        case 'endCall': {
          if (RoomView.lockState === 'locked') {
            Modal.showConfirm(MODAL_TXTS.endLockedCall).then(accept => {
              if (accept.altHasAccepted) {
                RoomView.participantsNumber = 0;
                Utils.sendEvent('roomView:endCall');
              } else if (accept) {
                Utils.sendEvent('roomView:setRoomLockState', 'unlocked');
                setTimeout(() => {
                  RoomView.participantsNumber = 0;
                  Utils.sendEvent('roomView:endCall');
                }, 3000);
              }
            });
          } else {
            Modal.showConfirm(MODAL_TXTS.endCall).then(accept => {
              if (accept) {
                RoomView.participantsNumber = 0;
                Utils.sendEvent('roomView:endCall');
              }
            });
          }
          break;
        }
      }
    });

    const optionIcons = document.getElementById('top-icons-container');

    optionIcons.addEventListener('click', () => {
      BubbleFactory.get('chooseLayout').hide();
    });

    if (window.enableRoomLocking) {
      const lockRoom = document.getElementById('lockRoomContainer');

      lockRoom.addEventListener('click', () => {
        const lockIcon = document.getElementById('lock-room-icon');
        const lockState = lockIcon.getAttribute('data-icon');
        if (lockState === 'openLock') {
          Modal.showConfirm(MODAL_TXTS.lock).then(lock => {
            if (lock) {
              Utils.sendEvent('roomView:setRoomLockState', 'locked');
            }
          });
        }
        if (lockState === 'closedLock') {
          Utils.sendEvent('roomView:setRoomLockState', 'unlocked');
        }
      });
    }

    const switchMic = document.getElementById('pickMicContainer');

    switchMic.addEventListener('click', () => {
      const select = document.getElementById('select-devices');
      select.style.display = 'inline-block';
      Modal.showConfirm({
        head: 'Set mic input',
        detail: 'Please identify the audio source in the following list:',
        button: 'Change'
      }).then(start => {
        if (start) {
          Utils.sendEvent('roomView:setAudioSource', select.value);
        }
        select.style.display = 'none';
      });
    });

    const switchCam = document.getElementById('pickCamContainer');

    switchCam.addEventListener('click', () => {
      Utils.sendEvent('roomView:toggleFacingMode');
    });

    const muteAllparticipants = document.getElementById('muteAllContainer');
    if (muteAllparticipants) {
      muteAllparticipants.addEventListener('click', () => {
        Utils.sendEvent('roomView:muteAllSwitch', { status: true });
        setPublisherAudioSwitchStatus('muted');
      });
    }

    const menu = document.getElementById('top-banner');

    menu.addEventListener('click', e => {
      const elem = HTMLElems.getAncestorByTagName(e.target, 'a') || e.target;
      // pointer-events is not working on IE so we can receive as target a child
      elem.blur();

      if (!elem) {
        return;
      }

      switch (elem.id) {
        case 'viewRecordings':
          BubbleFactory.get('viewRecordings').toggle();
          break;
        case 'options-container':
        case 'chooseLayout':
          BubbleFactory.get('chooseLayout').toggle();
          break;
        case 'startArchiving':
        case 'stopArchiving':
          Utils.sendEvent(`roomView:${elem.id}`);
          break;
        case 'startChat':
        case 'stopChat':
          setChatStatus(elem.id === 'startChat');
          break;
        case 'addToCall':
          Utils.sendEvent('roomView:addToCall');
          break;
        case 'startSharingDesktop':
        case 'stopSharingDesktop':
          Utils.sendEvent('roomView:shareScreen');
          break;
        case 'videoSwitch':
          if (!videoSwitch.classList.contains('activated')) {
            setSwitchStatus(true, true, videoSwitch, 'roomView:videoSwitch');
          } else {
            setSwitchStatus(false, true, videoSwitch, 'roomView:videoSwitch');
          }
          break;
        case 'audioSwitch':
          if (!audioSwitch.classList.contains('activated')) {
            Modal.showConfirm(MODAL_TXTS.mute).then(shouldDisable => {
              if (shouldDisable) {
                setSwitchStatus(true, true, audioSwitch, 'roomView:muteAllSwitch');
                togglePublisherAudioElem.classList.remove('activated');
              }
            });
          } else {
            setSwitchStatus(false, true, audioSwitch, 'roomView:muteAllSwitch');
            togglePublisherAudioElem.classList.add('activated');
          }
      }
    });

    if (enableSip) {
      const dialOutBtn = document.getElementById('dialOutBtn');
      // Send event to get phonenumber from phoneNumberView
      dialOutBtn.addEventListener('click', event => {
        event.preventDefault();
        Utils.sendEvent('roomView:verifyDialOut');
      });

      // Listen for PhoneNumberView event
      Utils.addEventsHandlers('phoneNumberView:', {
        dialOut(evt) {
          const phonenumber = evt.detail;
          Utils.sendEvent('roomView:dialOut', phonenumber);
        }
      });
    }

    exports.addEventListener('archiving', e => {
      const detail = e.detail;

      switch (detail.status) {
        case 'started':
          onStartArchiving(detail);

          break;
        case 'stopped':
          onStopArchiving();
          break;
      }

      document.body.data('archiveStatus', e.detail.status);
    });

    Utils.addEventsHandlers('screenShareController:', screenShareCtrEvents, exports);
    Utils.addEventsHandlers('roomController:', roomControllerEvents, exports);
    Utils.addEventsHandlers('chat:', chatEvents);
    Utils.addEventsHandlers('chatView:', chatViews);
    Utils.addEventsHandlers('hangout:', hangoutEvents);
  };

  function toggleScreenSharing(evt) {
    const isSharing = evt.detail.isSharing;
    document.body.data('desktopStatus', isSharing ? 'sharing' : 'notSharing');
  }

  const getURLtoShare = () => {
    const textArea = document.getElementById('current-url');
    const urlToShare = window.location.origin + window.location.pathname;
    textArea.innerHTML = urlToShare;
  };

  const init = (enableHangoutScroll, aEnableArchiveManager, aEnableSip) => {
    enableArchiveManager = aEnableArchiveManager;
    initHTMLElements();
    dock.style.visibility = 'visible';
    enableSip = aEnableSip;
    addHandlers();
    getURLtoShare();
    LayoutManager.init('.streams', enableHangoutScroll);
  };

  exports.RoomView = {
    init,

    set participantsNumber(value) {
      HTMLElems.replaceText(participantsStrElem, value);
      if (!window.enableRoomLocking) {
        return;
      }
      if (value === 1 && RoomView.lockState !== 'locked') {
        document.getElementById('lockRoomContainer').style.display = 'none';
      } else {
        document.getElementById('lockRoomContainer').style.removeProperty('display');
      }
      if (value === 1 && RoomView.lockState === 'locked') {
        Utils.sendEvent('roomView:setRoomLockState', 'unlocked');
        document.getElementById('lockRoomContainer').style.display = 'none';
      }
    },

    set recordingsNumber(value) {
      if (!manageRecordingsElem) {
        return;
      }
      if (value === 0) {
        manageRecordingsElem.style.display = 'none';
        document.getElementById('toggleArchiving').classList.remove('manage-recordings');
      } else {
        manageRecordingsElem.style.display = 'block';
        recordingsNumberElem && (recordingsNumberElem.textContent = value);
        document.getElementById('toggleArchiving').classList.add('manage-recordings');
      }
    },

    showRoom,
    showPublisherButtons,
    createStreamView,
    deleteStreamView,
    setAudioSwitchRemotely,
    showConfirmChangeMicStatus
  };
})(this);
