/* global Utils, RoomStatus, RoomView, LazyLoader, Modal,
ChatController, GoogleAuth, LayoutMenuController, OTHelper, PrecallController,
RecordingsController, ScreenShareController, FeedbackController,
PhoneNumberController, ResizeSensor, maxUsersPerRoom */

!((exports) => {
  const debug = new Utils.MultiLevelLogger('roomController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  let otHelper;
  let numUsrsInRoom = 0;
  let _disabledAllVideos = false;
  let enableAnnotations = true;
  let enableHangoutScroll = false;
  let enableArchiveManager = false;
  let enableSip = false;
  let requireGoogleAuth = false; // For SIP dial-out
  let googleAuth = null;

  let setPublisherReady;
  const publisherReady = new Promise((resolve) => {
    setPublisherReady = resolve;
  });

  const STATUS_KEY = 'room';
  let _sharedStatus = {
    roomMuted: false,
  };

  let { userName } = window;
  let roomURI = null;
  let token = null;

  const publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    showControls: true,
    resolution: window.publisherResolution,
    style: {
      audioLevelDisplayMode: 'auto',
      buttonDisplayMode: 'off',
      nameDisplayMode: 'off',
      videoDisabledDisplayMode: 'on',
      showArchiveStatus: false,
    },
  };

  const subscriberOptions = {
    camera: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: true,
      style: {
        audioLevelDisplayMode: 'auto',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off',
        videoDisabledDisplayMode: 'auto',
        showArchiveStatus: false,
      },
    },
    screen: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: false,
      style: {
        audioLevelDisplayMode: 'off',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'on',
        videoDisabledDisplayMode: 'off',
      },
    },
    noVideo: {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: true,
      style: {
        audioLevelDisplayMode: 'auto',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'on',
        videoDisabledDisplayMode: 'off',
      },
    },
  };

  const isMobile = () => typeof window.orientation !== 'undefined';

  const SubscriberButtons = (streamVideoType, phoneNumber) => {
    const isScreenSharing = streamVideoType === 'screen';

    const buttons = { };

    if (!phoneNumber) {
      buttons.video = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: isScreenSharing ? 'desktop' : 'video',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersVideo',
        enabled: true,
      };
    }

    if (!isScreenSharing) {
      buttons.audio = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'audio',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersAudio',
        enabled: true,
      };
    }
    if (phoneNumber && (phoneNumber in dialedNumberTokens)) {
      buttons.hangup = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'hangup',
        eventName: 'click',
        context: 'otHelper',
        action: 'hangup',
        enabled: true,
      };
    }

    return buttons;
  };

  const publisherButtons = {
    video: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'video',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherVideo',
      enabled: true,
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'mic',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherAudio',
      enabled: true,
    },
  };

  let subscriberStreams = { };
  const dialedNumberTokens = { };

  const sendVideoEvent = (stream) => {
    if (!stream) {
      return;
    }

    Utils.sendEvent(`roomController:${stream.hasVideo ? 'videoEnabled' : 'videoDisabled'}`, {
      id: stream.streamId,
    });
  };

  const sendArchivingOperation = (operation) => {
    const data = {
      userName,
      roomName: roomURI,
      operation,
    };

    Request.sendArchivingOperation(data);
  };

  const dialOut = (phoneNumber) => {
    const alreadyInCall = Object.keys(subscriberStreams)
      .some((streamId) => {
        if (subscriberStreams[streamId]) {
          const { stream } = subscriberStreams[streamId];
          return (stream.isSip && stream.name === phoneNumber);
        }
        return false;
      });

    if (alreadyInCall) {
      console.log(`The number is already in this call: ${phoneNumber}`); // eslint-disable-line no-console
    } else {
      let googleIdToken;
      if (requireGoogleAuth) {
        const user = googleAuth.currentUser.get();
        googleIdToken = user.getAuthResponse().id_token;
      } else {
        googleIdToken = '';
      }
      const data = {
        phoneNumber,
        googleIdToken,
      };
      Request.dialOut(roomURI, data);
      dialedNumberTokens[phoneNumber] = googleIdToken;
    }
  };

  const hangup = (streamId) => {
    if (!subscriberStreams[streamId]) {
      return;
    }
    const { stream } = subscriberStreams[streamId];
    if (!stream.isSip) {
      return;
    }
    const { phoneNumber } = stream;
    if (!(phoneNumber in dialedNumberTokens)) {
      return;
    }
    const token = dialedNumberTokens[phoneNumber];
    Request.hangUp(phoneNumber, token);
    delete dialedNumberTokens[phoneNumber];
  };

  const roomStatusHandlers = {
    updatedRemotely() {
      publisherReady.then(() => {
        _sharedStatus = RoomStatus.get(STATUS_KEY);
        const { roomMuted } = _sharedStatus;
        setAudioStatus(roomMuted);
        roomMuted && Utils.sendEvent('roomController:roomMuted', { isJoining: true });
      });
    },
  };

  const changeSubscriberStatus = (name, status) => {
    _disabledAllVideos = status;

    Object.keys(subscriberStreams).forEach((aStreamId) => {
      if (subscriberStreams[aStreamId]
          && subscriberStreams[aStreamId].stream.videoType === 'camera') {
        pushSubscriberButton(aStreamId, name, status);
      }
    });
  };

  const pushSubscriberButton = (streamId, name, status) => {
    viewEventHandlers.buttonClick({
      detail: {
        streamId,
        name,
        disableAll: true,
        status,
      },
    });
  };

  function sendSignalMuteAll(status, onlyChangeSwitch) {
    otHelper.sendSignal('muteAll', { status, onlyChangeSwitch });
  }

  function sendSignalLock(status) {
    otHelper.sendSignal('roomLocked', { status });
  }

  const viewEventHandlers = {
    endCall() {
      otHelper.disconnect();
      const url = window.location.origin.concat('/thanks');
      window.location.href = url;
    },
    startArchiving(evt) {
      sendArchivingOperation((evt.detail && evt.detail.operation) || 'startComposite');
    },
    stopArchiving() {
      sendArchivingOperation('stop');
    },
    streamVisibilityChange(evt) {
      const getStatus = (info) => {
        let status = null;

        if (evt.detail.value === 'hidden') {
          info.prevEnabled = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          status = false;
        } else {
          status = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          delete info.prevEnabled;
        }

        return status;
      };

      const streamId = evt.detail.id;
      if (streamId !== 'publisher') {
        const stream = subscriberStreams[streamId];
        stream && otHelper.toggleSubscribersVideo(stream.stream,
          getStatus(stream.buttons.video));
      }
    },
    buttonClick(evt) {
      const { streamId } = evt.detail;
      const { streamType } = evt.detail;
      const { name } = evt.detail;
      const disableAll = !!evt.detail.disableAll;
      const switchStatus = evt.detail.status;
      let buttonInfo = null;
      const args = [];
      let newStatus;
      const isPublisher = streamId === 'publisher';

      if (isPublisher) {
        buttonInfo = publisherButtons[name];
        newStatus = !buttonInfo.enabled;
        // There are a couple of possible race conditions that would end on us not changing
        // the status on the publisher (because it's already on that state).
        if (!otHelper.isPublisherReady || otHelper.publisherHas(name) === newStatus) {
          return;
        }
      } else {
        const stream = subscriberStreams[streamId];
        if (!stream) {
          debug.error('Got an event from an nonexistent stream');
          return;
        }
        if (name === 'hangup') {
          hangup(streamId);
          return;
        }
        buttonInfo = stream.buttons[name];
        args.push(stream.stream);
        newStatus = !buttonInfo.enabled;
        // BUG xxxx - We don't receive videoDisabled/videoEnabled events when
        // stopping/starting the screen sharing video
        // OPENTOK-26021 - We don't receive any event when mute/unmute the audio in local streams
        if (streamType === 'screen' || name === 'audio') {
          // so we assume the operation was performed properly and change the UI status
          sendStatus({ stream: stream.stream }, name, newStatus);
        }
      }

      if (!buttonInfo) {
        debug.error('Got an event from an unknown button!');
        return;
      }

      args.push(newStatus);

      if (!disableAll || (disableAll && (switchStatus !== newStatus))) {
        const obj = exports[buttonInfo.context];
        obj[buttonInfo.action](...args);
        // if stream button clicked and isn't a screen
        if (!disableAll && streamType !== 'screen') {
          // If type = 'audio'
          //   it only has to propagate the change when the button clicked is the microphone
          // if type = 'video'
          //   only when button clicked is not the publisher's one (is a subscriber's video button)
          // it type = 'screen'
          //   don't do anything
          const isMicrophone = name === 'audio' && isPublisher;
          const isSubscribeToVideo = name === 'video' && !isPublisher;
          if (isMicrophone || isSubscribeToVideo) {
            Utils.sendEvent('roomController:userChangeStatus', { status: newStatus, name });
            if (isMicrophone) {
              sendSignalMuteAll(false, true);
              _sharedStatus.roomMuted = false;
            }
          }
        }
      }
    },
    videoSwitch(evt) {
      changeSubscriberStatus('video', evt.detail.status);
    },
    muteAllSwitch(evt) {
      const roomMuted = evt.detail.status;
      _sharedStatus.roomMuted = roomMuted;
      setAudioStatus(roomMuted);
      sendSignalMuteAll(roomMuted, false);
    },
    dialOut(evt) {
      if (evt.detail) {
        const phoneNumber = evt.detail.replace(/\D/g, '');
        if (requireGoogleAuth && (googleAuth.isSignedIn.get() !== true)) {
          googleAuth.signIn().then(() => {
            document.body.data('google-signed-in', 'true');
            dialOut(phoneNumber);
          });
        } else {
          dialOut(phoneNumber);
        }
      }
    },
    addToCall() {
      if (isMobile() && navigator.share) {
        showMobileShareUrl();
      } else {
        showAddToCallModal();
      }
    },
    togglePublisherAudio(evt) {
      const newStatus = evt.detail.hasAudio;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('audio') !== newStatus) {
        otHelper.togglePublisherAudio(newStatus);
      }
    },
    togglePublisherVideo(evt) {
      const newStatus = evt.detail.hasVideo;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('video') !== newStatus) {
        otHelper.togglePublisherVideo(newStatus);
      }
    },
    setRoomLockState(evt) {
      const state = evt.detail;
      const data = {
        userName,
        token,
        state,
        roomURI,
      };

      Request.sendLockingOperation(data).then(() => sendSignalLock(state));
    },
  };

  const setAudioStatus = (switchStatus) => {
    otHelper.isPublisherReady && viewEventHandlers.buttonClick({
      detail: {
        streamId: 'publisher',
        name: 'audio',
        disableAll: true,
        status: switchStatus,
      },
    });
  };

  const sendStatus = (evt, control, enabled) => {
    let stream = evt.stream || evt.target.stream;
    if (!stream) {
      return;
    }

    const id = stream.streamId;
    stream = subscriberStreams[id];
    const buttonInfo = !stream ? publisherButtons[control] : stream.buttons[control];
    buttonInfo.enabled = !!enabled;

    Utils.sendEvent(`roomController:${control}`, {
      id,
      reason: evt.reason,
      enabled: buttonInfo.enabled,
    });
  };

  const _subscriberHandlers = {
    videoDisabled(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video');
      sendVideoEvent(evt.target.stream);
    },
    videoEnabled(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video', true);
      sendVideoEvent(evt.target.stream);
    },
    disconnected(evt) {
      Utils.sendEvent('roomController:disconnected', {
        id: evt.target.stream.streamId,
      });
    },
    connected(evt) {
      Utils.sendEvent('roomController:connected', {
        id: evt.target.stream.streamId,
      });
    },
  };

  let _allHandlers = {
    connectionCreated() {
      RoomView.participantsNumber = ++numUsrsInRoom;
    },
    connectionDestroyed() {
      RoomView.participantsNumber = --numUsrsInRoom;
    },
    sessionConnected() {
      Utils.sendEvent('roomController:sessionConnected');
    },
    sessionDisconnected() {
      // The client has disconnected from the session.
      // This event may be dispatched asynchronously in response to a successful
      // call to the disconnect() method of the Session object.
      // The event may also be disptached if a session connection is lost
      // inadvertantly, as in the case of a lost network connection.
      numUsrsInRoom = 0;
      Utils.sendEvent('roomController:sessionDisconnected');
      subscriberStreams = {};
    },
    streamCreated(evt) {
      publisherReady.then(() => {
        // A new stream, published by another client, has been created on this
        // session. For streams published by your own client, the Publisher object
        // dispatches a streamCreated event. For a code example and more details,
        // see StreamEvent.
        const { stream } = evt;
        // SIP call streams have no video.
        const streamVideoType = stream.videoType || 'noVideo';

        let connectionData;
        try {
          connectionData = JSON.parse(stream.connection.data);
        } catch (error) {
          connectionData = {};
        }
        // Add an isSip flag to stream object
        stream.isSip = !!connectionData.sip;
        if (!stream.name) {
          stream.name = connectionData.name || '';
        }

        const { streamId } = stream;
        stream.phoneNumber = stream.isSip && stream.name;
        if (stream.isSip) {
          stream.name = 'Invited Participant';
        }

        subscriberStreams[streamId] = {
          stream,
          buttons: SubscriberButtons(streamVideoType, stream.phoneNumber),
        };

        const subOptions = subscriberOptions[streamVideoType];
        const enterWithVideoDisabled = streamVideoType === 'camera' && _disabledAllVideos;

        _sharedStatus = RoomStatus.get(STATUS_KEY);

        const subsDOMElem = RoomView.createStreamView(streamId, {
          name: stream.name,
          type: stream.videoType,
          controlElems: subscriberStreams[streamId].buttons,
        });

        subOptions.subscribeToVideo = !enterWithVideoDisabled;

        subscriberStreams[streamId].subscriberPromise = otHelper.subscribe(
          evt.stream, subsDOMElem, subOptions, {}, enableAnnotations,
        ).then((subscriber) => {
          if (streamVideoType === 'screen') {
            enableAnnotations && Utils.sendEvent('roomController:annotationStarted');
            const subContainer = subscriber.element.parentElement;
            Utils.sendEvent('layoutView:itemSelected', {
              item: subContainer,
            });
            return subscriber;
          }

          Object.keys(_subscriberHandlers).forEach((name) => {
            subscriber.on(name, _subscriberHandlers[name]);
          });
          if (enterWithVideoDisabled) {
            pushSubscriberButton(streamId, 'video', true);
          }

          new ResizeSensor(subsDOMElem, () => { // eslint-disable-line no-new
            const subsDimension = {
              width: subsDOMElem.clientWidth,
              height: subsDOMElem.clientHeight,
            };
            otHelper.setPreferredResolution(subscriber, null, subsDimension, null, null);
          });

          sendVideoEvent(evt.stream);
          return subscriber;
        }, (error) => {
          debug.error(`Error susbscribing new participant. ${error.message}`);
        });
      });
    },
    streamDestroyed(evt) {
      // A stream from another client has stopped publishing to the session.
      // The default behavior is that all Subscriber objects that are subscribed
      // to the stream are unsubscribed and removed from the HTML DOM. Each
      // Subscriber object dispatches a destroyed event when the element is
      // removed from the HTML DOM. If you call the preventDefault() method in
      // the event listener for the streamDestroyed event, the default behavior
      // is prevented and you can clean up Subscriber objects using your own
      // code. See Session.getSubscribersForStream().
      // For streams published by your own client, the Publisher object
      // dispatches a streamDestroyed event.
      // For a code example and more details, see StreamEvent.
      const { stream } = evt;
      if (stream.videoType === 'screen') {
        Utils.sendEvent('roomController:annotationEnded');
      }
      RoomView.deleteStreamView(stream.streamId);
      subscriberStreams[stream.streamId] = null;
    },
    streamPropertyChanged(evt) {
      if (otHelper.publisherId !== evt.stream.id) {
        return;
      }
      if (evt.changedProperty === 'hasVideo') {
        evt.reason = 'publishVideo';
        sendStatus(evt, 'video', evt.newValue);
      } else if (evt.changedProperty === 'hasAudio') {
        evt.reason = 'publishAudio';
        sendStatus(evt, 'audio', evt.newValue);
      }
    },
    archiveStarted(evt) {
      // Dispatched when an archive recording of the session starts
      Utils.sendEvent('archiving', {
        status: 'started',
        id: evt.id,
      });
    },
    archiveStopped() {
      // Dispatched when an archive recording of the session stops
      Utils.sendEvent('archiving', { status: 'stopped' });
    },
    'signal:roomLocked': function (evt) {
      const roomState = JSON.parse(evt.data).status;
      Utils.sendEvent('roomController:roomLocked', roomState);
    },
    'signal:muteAll': function (evt) {
      const statusData = JSON.parse(evt.data);
      const muteAllSwitch = statusData.status;
      const { onlyChangeSwitch } = statusData;
      // onlyChangeSwitch is true when the iOS app sends a false muteAll signal.
      if (onlyChangeSwitch) {
        return;
      }

      const setNewAudioStatus = ((isMuted) => {
        if (_sharedStatus.roomMuted !== isMuted) {
          return;
        }
        setAudioStatus(isMuted);
      }).bind(undefined, muteAllSwitch);

      if (!otHelper.isMyself(evt.from)) {
        _sharedStatus.roomMuted = muteAllSwitch;
        setAudioStatus(muteAllSwitch);
        Utils.sendEvent('roomController:roomMuted', { isJoining: false });
        RoomView.showConfirmChangeMicStatus(muteAllSwitch).then(setNewAudioStatus);
      }
    },
    'signal:archives': function (evt) {
      Utils.sendEvent('roomController:archiveUpdates', evt);
    },
  };

  function showMobileShareUrl() {
    navigator.share({
      title: 'Invite Participant',
      url: location.href,
    })
      .then(() => { console.log('Successful share'); })
      .catch((error) => { console.log('Error sharing', error); });
  }

  function addClipBoardFeature(selector) {
    const inviteLinkBtn = document.getElementById('copyInviteLinkBtn');
    const inputElem = document.getElementById('current-url');
    if (inputElem && inputElem.textContent) {
      navigator.clipboard.writeText(inputElem.textContent.trim())
        .then(() => {
          if (inviteLinkBtn.innerText !== 'Copied!') {
            const originalText = inviteLinkBtn.innerText;
            inviteLinkBtn.innerText = 'Copied!';
            setTimeout(() => {
              Modal.hide(selector);
              inviteLinkBtn.innerText = originalText;
            }, 2000);
          }
        });
    }
  }

  function showAddToCallModal() {
    const selector = '.add-to-call-modal';
    return Modal.show(selector).then(() => new Promise((resolve) => {
      const copyButton = document.getElementById('copyInviteLinkBtn');
      const dialButton = document.getElementById('dialOutBtn');

      copyButton && copyButton.addEventListener('click', function onClicked(event) {
        event.preventDefault();
        copyButton.removeEventListener('click', onClicked);
        addClipBoardFeature(selector);
        resolve();
      });

      dialButton && dialButton.addEventListener('click', function onClicked(event) {
        event.preventDefault();
        dialButton.removeEventListener('click', onClicked);
        Modal.hide(selector);
        resolve();
      });
    }));
  }

  function getRoomParams() {
    if (!exports.RoomController) {
      throw new Error('Room Controller is not defined. Missing script tag?');
    }

    // pathName should be /room/<roomURI>[?username=<userName>]
    const pathName = document.location.pathname.split('/');

    if (!pathName || pathName.length < 2) {
      throw new Error('Invalid path');
    }

    let roomName = '';
    let roomURI = '';
    const { length } = pathName;
    if (length > 0) {
      roomURI = pathName[length - 1];
    }
    roomName = Utils.decodeStr(roomURI);

    // Recover user identifier
    const params = Utils.parseSearch(document.location.search);
    const usrId = window.userName || params.getFirstValue('userName');
    enableHangoutScroll = params.getFirstValue('enableHangoutScroll') !== undefined;

    return PrecallController.showCallSettingsPrompt(roomName, usrId, otHelper)
      .then((info) => {
        RoomView.showRoom();
        RoomView.roomURI = info.roomURI;
        publisherOptions.publishAudio = info.publisherOptions.publishAudio;
        publisherOptions.publishVideo = info.publisherOptions.publishVideo;
        publisherOptions.audioSource = info.publisherOptions.audioSource;
        publisherOptions.videoSource = info.publisherOptions.videoSource;
        return info;
      });
  }

  function getRoomInfo(aRoomParams) {
    return Request
      .getRoomInfo(aRoomParams)
      .then((aRoomInfo) => {
        if (!(aRoomInfo && aRoomInfo.token && aRoomInfo.sessionId
              && aRoomInfo.apiKey && aRoomInfo.username)) {
          debug.error('Error getRoomParams [', aRoomInfo,
            '] without correct response');
          throw new Error('Error getting room parameters');
        }
        aRoomInfo.roomURI = aRoomParams.roomURI;
        aRoomInfo.publishAudio = aRoomParams.publishAudio;
        aRoomInfo.publishVideo = aRoomParams.publishVideo;
        enableAnnotations = aRoomInfo.enableAnnotation;
        enableArchiveManager = aRoomInfo.enableArchiveManager;
        enableSip = aRoomInfo.enableSip;
        requireGoogleAuth = aRoomInfo.requireGoogleAuth;
        return aRoomInfo;
      });
  }

  const modules = [
    '/js/components/htmlElems.js',
    '/js/helpers/resolutionAlgorithms.js',
    '/js/itemsHandler.js',
    '/js/layoutView.js',
    '/js/layouts.js',
    '/js/min/layoutManager.min.js',
    '/js/roomView.js',
    '/js/roomStatus.js',
    '/js/min/chatController.min.js',
    '/js/min/recordingsController.min.js',
    '/js/min/precallController.min.js',
    '/js/layoutMenuController.js',
    '/js/min/screenShareController.min.js',
    '/js/min/feedbackController.min.js',
    '/js/googleAuth.js',
    '/js/min/phoneNumberController.min.js',
    '/js/vendor/ResizeSensor.js',
  ];

  const init = () => {
    LazyLoader.load(modules)
      .then(() => {
        Utils.addEventsHandlers('roomView:', viewEventHandlers, exports);
        Utils.addEventsHandlers('roomStatus:', roomStatusHandlers, exports);
        Utils.addEventsHandlers('precallView:', {
          submit() {
          // Jeff to do: The room logic should go here, not in PrecallController.
          },
        });

        return PrecallController.init();
      })
      .then(() => LazyLoader.load('/js/helpers/OTHelper.js'))
      .then(() => {
        otHelper = new OTHelper({});
        exports.otHelper = otHelper;
      })
      .then(getRoomParams)
      .then(getRoomInfo)
      .then((aParams) => {
        let loadAnnotations = Promise.resolve();
        if (enableAnnotations) {
          exports.OTKAnalytics = exports.OTKAnalytics
          || (() => ({
            addSessionInfo() {},
            logEvent(a, b) {
              console.log(a, b); // eslint-disable-line no-console
            },
          }));

          loadAnnotations = LazyLoader.load([
            'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js',
            '/js/vendor/opentok-annotation.js',
          ]);
        }
        return loadAnnotations.then(() => aParams);
      })
      .then((aParams) => {
        RoomView.init(enableHangoutScroll, enableArchiveManager, enableSip);
        // Init this controller before connect to the session
        // to start receiving signals about archives updates
        RecordingsController.init(enableArchiveManager, aParams.archives);

        roomURI = aParams.roomURI;
        userName = aParams.username ? aParams.username.substring(0, 1000) : '';
        userName = Utils.htmlEscape(userName.substring(0, 25));
        token = aParams.token;

        const sessionInfo = {
          apiKey: aParams.apiKey,
          sessionId: aParams.sessionId,
          token: aParams.token,
        };

        const connect = otHelper.connect.bind(otHelper, sessionInfo);

        const waitForConnectionCount = () => new Promise((resolve) => {
          if (!maxUsersPerRoom) {
            return resolve();
          }
          return setTimeout(() => {
            if (numUsrsInRoom > maxUsersPerRoom) {
              Utils.sendEvent('roomController:meetingFullError');
              return;
            }
            resolve();
          }, 500);
        });

        RoomView.participantsNumber = 0;

        _allHandlers = RoomStatus.init(_allHandlers, { room: _sharedStatus });

        if (enableSip && requireGoogleAuth) {
          GoogleAuth.init(aParams.googleId, aParams.googleHostedDomain, (aGoogleAuth) => {
            googleAuth = aGoogleAuth;
            if (googleAuth.isSignedIn.get()) {
              document.body.data('google-signed-in', 'true');
            }
          });
        }

        ChatController
          .init(userName, _allHandlers)
          .then(connect)
          .then(LayoutMenuController.init)
          .then(waitForConnectionCount)
          .then(() => {
            const publisherElement = RoomView.createStreamView('publisher', {
              name: userName,
              type: 'publisher',
            });
            // If we have all audios disabled, we need to set the button status
            // and don't publish audio
            if (_sharedStatus.roomMuted) {
            // Set visual status of button
              sendStatus({
                stream: {
                  streamId: 'Publisher',
                },
                reason: 'publishAudio',
              }, 'audio', false);
              // Don't publish audio
              publisherOptions.publishAudio = false;
            }
            publisherOptions.name = userName;
            return otHelper.publish(publisherElement, publisherOptions, {}).then(() => {
              setPublisherReady();
              RoomView.showPublisherButtons(publisherOptions);
            }).catch((errInfo) => {
              if (errInfo.error.name === 'OT_CHROME_MICROPHONE_ACQUISITION_ERROR') {
                Utils.sendEvent('roomController:chromePublisherError');
                otHelper.disconnect();
              }
            });
          })
          .then(() => {
            ScreenShareController.init(userName, aParams.chromeExtId, otHelper, enableAnnotations);
            FeedbackController.init(otHelper, aParams.reportIssueLevel);
            PhoneNumberController.init();
            Utils.sendEvent('roomController:controllersReady');
          })
          .catch((error) => {
            debug.error(`Error Connecting to room. ${error.message}`);
          });
      });
  };

  const RoomController = {
    init,
  };

  exports.RoomController = RoomController;
})(this);
