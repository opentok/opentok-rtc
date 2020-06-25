/* global Utils, Request, RoomStatus, RoomView, LayoutManager, LazyLoader, Modal,
ChatController, GoogleAuth, LayoutMenuController, OTHelper, PrecallController,
RecordingsController, ScreenShareController, FeedbackController,
PhoneNumberController, ResizeSensor, maxUsersPerRoom */

!(function (exports) {
  'use strict';

  var debug =
    new Utils.MultiLevelLogger('roomController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  var otHelper;
  var numUsrsInRoom = 0;
  var _disabledAllVideos = false;
  var enableAnnotations = true;
  var enableHangoutScroll = false;
  var enableArchiveManager = false;
  var enableSip = false;
  var requireGoogleAuth = false; // For SIP dial-out
  var googleAuth = null;

  var setPublisherReady;
  var publisherReady = new Promise(function (resolve) {
    setPublisherReady = resolve;
  });

  var STATUS_KEY = 'room';
  var _sharedStatus = {
    roomMuted: false
  };

  var userName = null;
  var roomURI = null;
  var resolutionAlgorithm = null;
  var debugPreferredResolution = null;
  var token = null;

  var publisherOptions = {
    insertMode: 'append',
    width: '100%',
    height: '100%',
    showControls: true,
    resolution: publisherResolution,
    style: {
      audioLevelDisplayMode: 'auto',
      buttonDisplayMode: 'off',
      nameDisplayMode: 'off',
      videoDisabledDisplayMode: 'on',
      showArchiveStatus: false
    }
  };

  var subscriberOptions = {
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
        showArchiveStatus: false
      }
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
        videoDisabledDisplayMode: 'off'
      }
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
        videoDisabledDisplayMode: 'off'
      }
    }
  };

  var isMobile = function () { return typeof window.orientation !== 'undefined'; };

  var SubscriberButtons = function (streamVideoType, phoneNumber) {
    var isScreenSharing = streamVideoType === 'screen';

    var buttons = { };

    if (!phoneNumber) {
      buttons.video = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: isScreenSharing ? 'desktop' : 'video',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersVideo',
        enabled: true
      };
    }

    if (!isScreenSharing) {
      buttons.audio = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'audio',
        eventName: 'click',
        context: 'otHelper',
        action: 'toggleSubscribersAudio',
        enabled: true
      };
    }
    if (phoneNumber && (phoneNumber in dialedNumberTokens)) {
      buttons.hangup = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'hangup',
        eventName: 'click',
        context: 'otHelper',
        action: 'hangup',
        enabled: true
      };
    }

    return buttons;
  };

  var publisherButtons = {
    video: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'video',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherVideo',
      enabled: true
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'mic',
      eventName: 'click',
      context: 'otHelper',
      action: 'togglePublisherAudio',
      enabled: true
    }
  };

  var subscriberStreams = { };
  var dialedNumberTokens = {};

  // We want to use media priorization on the subscriber streams. We're going to restrict the
  // maximum width and height to the one that's actually displayed. To do that, we're going to
  // observe changes on the elements that hold the subscribers.
  // Note that mutationObserver only works on IE11+, but that the previous alternative doesn't
  // work all that well either.
  var processMutation = function (aMutation) {
    var elem = aMutation.target;
    if ((aMutation.attributeName !== 'style' && aMutation.attributeName !== 'class') ||
        elem.data('streamType') !== 'camera') {
      return;
    }
    var streamId = elem.data('id');
    var subscriberPromise =
      subscriberStreams[streamId] && subscriberStreams[streamId].subscriberPromise;

    subscriberPromise.then(function (subscriber) {
      if (debugPreferredResolution) {
        // If the user requested debugging this, we're going to export all the information through
        // window so he can examine the values.
        window.subscriberElem = window.subscriberElem || {};
        window.subscriberElem[streamId] = elem;
        window.subscriber = window.subscriber || {};
        window.subscriber[streamId] = subscriber;
        window.dumpResolutionInfo = window.dumpResolutionInfo || function () {
          Object.keys(window.subscriber)
            .forEach(function (aSub) {
              var sub = window.subscriber[aSub];
              var stream = sub && sub.stream;
              var vd = stream && stream.videoDimensions;
              var streamPref = (stream && stream.getPreferredResolution()) ||
                                 { width: 'NA', height: 'NA' };
              stream && console.log( // eslint-disable-line no-console
                'StreamId:', aSub, 'Real:', sub.videoWidth(), 'x', sub.videoHeight(),
                'Stream.getPreferredResolution:', streamPref.width, 'x', streamPref.height,
                'Stream.VDimension:', vd.width, 'x', vd.height
              );
            });
        };
      }

      var parent = elem.parentNode;

      var parentDimension = {
        width: parent.clientWidth,
        height: parent.clientHeight
      };
      var subsDimension = {
        width: elem.clientWidth,
        height: elem.clientHeight
      };
      otHelper.setPreferredResolution(subscriber, parentDimension, subsDimension, numUsrsInRoom - 1,
                                      resolutionAlgorithm);
    });
  };
  var _mutationObserver = exports.MutationObserver &&
    new exports.MutationObserver(function (aMutations) {
      aMutations.forEach(processMutation);
    });

  var sendVideoEvent = function (stream) {
    if (!stream) {
      return;
    }

    Utils.sendEvent('roomController:' + (stream.hasVideo ? 'videoEnabled' : 'videoDisabled'), {
      id: stream.streamId
    });
  };

  var sendArchivingOperation = function (operation) {
    var data = {
      userName: userName,
      roomName: roomURI,
      operation: operation
    };

    Request.sendArchivingOperation(data);
  };

  var dialOut = function (phoneNumber) {
    var alreadyInCall = Object.keys(subscriberStreams)
    .some(function (streamId) {
      if (subscriberStreams[streamId]) {
        var stream = subscriberStreams[streamId].stream;
        return (stream.isSip && stream.name === phoneNumber);
      }
      return false;
    });

    if (alreadyInCall) {
      console.log('The number is already in this call: ' + phoneNumber); // eslint-disable-line no-console
    } else {
      var googleIdToken;
      if (requireGoogleAuth) {
        var user = googleAuth.currentUser.get();
        googleIdToken = user.getAuthResponse().id_token;
      } else {
        googleIdToken = '';
      }
      var data = {
        phoneNumber: phoneNumber,
        googleIdToken: googleIdToken
      };
      Request.dialOut(roomURI, data);
      dialedNumberTokens[phoneNumber] = googleIdToken;
    }
  };

  var hangup = function (streamId) {
    if (!subscriberStreams[streamId]) {
      return;
    }
    var stream = subscriberStreams[streamId].stream;
    if (!stream.isSip) {
      return;
    }
    var phoneNumber = stream.phoneNumber;
    if (!(phoneNumber in dialedNumberTokens)) {
      return;
    }
    var token = dialedNumberTokens[phoneNumber];
    Request.hangUp(phoneNumber, token);
    delete dialedNumberTokens[phoneNumber];
  };

  var roomStatusHandlers = {
    updatedRemotely: function () {
      publisherReady.then(function () {
        _sharedStatus = RoomStatus.get(STATUS_KEY);
        var roomMuted = _sharedStatus.roomMuted;
        setAudioStatus(roomMuted);
        roomMuted && Utils.sendEvent('roomController:roomMuted', { isJoining: true });
      });
    }
  };

  var changeSubscriberStatus = function (name, status) {
    _disabledAllVideos = status;

    Object.keys(subscriberStreams).forEach(function (aStreamId) {
      if (subscriberStreams[aStreamId] &&
          subscriberStreams[aStreamId].stream.videoType === 'camera') {
        pushSubscriberButton(aStreamId, name, status);
      }
    });
  };

  var pushSubscriberButton = function (streamId, name, status) {
    viewEventHandlers.buttonClick({
      detail: {
        streamId: streamId,
        name: name,
        disableAll: true,
        status: status
      }
    });
  };

  function sendSignalMuteAll(status, onlyChangeSwitch) {
    otHelper.sendSignal('muteAll', { status: status, onlyChangeSwitch: onlyChangeSwitch });
  }

  function sendSignalLock(status) {
    otHelper.sendSignal('roomLocked', { status });
  }

  var viewEventHandlers = {
    endCall: function () {
      otHelper.disconnect();
      var url = window.location.origin.concat('/thanks');
      window.location.href = url;
      
    },
    startArchiving: function (evt) {
      sendArchivingOperation((evt.detail && evt.detail.operation) || 'startComposite');
    },
    stopArchiving: function () {
      sendArchivingOperation('stop');
    },
    streamVisibilityChange: function (evt) {
      var getStatus = function (info) {
        var status = null;

        if (evt.detail.value === 'hidden') {
          info.prevEnabled = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          status = false;
        } else {
          status = 'prevEnabled' in info ? info.prevEnabled : info.enabled;
          delete info.prevEnabled;
        }

        return status;
      };

      var streamId = evt.detail.id;
      if (streamId !== 'publisher') {
        var stream = subscriberStreams[streamId];
        stream && otHelper.toggleSubscribersVideo(stream.stream,
                     getStatus(stream.buttons.video));
      }
    },
    buttonClick: function (evt) {
      var streamId = evt.detail.streamId;
      var streamType = evt.detail.streamType;
      var name = evt.detail.name;
      var disableAll = !!evt.detail.disableAll;
      var switchStatus = evt.detail.status;
      var buttonInfo = null;
      var args = [];
      var newStatus;
      var isPublisher = streamId === 'publisher';

      if (isPublisher) {
        buttonInfo = publisherButtons[name];
        newStatus = !buttonInfo.enabled;
        // There are a couple of possible race conditions that would end on us not changing
        // the status on the publisher (because it's already on that state).
        if (!otHelper.isPublisherReady || otHelper.publisherHas(name) === newStatus) {
          return;
        }
      } else {
        var stream = subscriberStreams[streamId];
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
        var obj = exports[buttonInfo.context];
        obj[buttonInfo.action].apply(obj, args);
        // if stream button clicked and isn't a screen
        if (!disableAll && streamType !== 'screen') {
          // If type = 'audio'
          //   it only has to propagate the change when the button clicked is the microphone
          // if type = 'video'
          //   only when button clicked is not the publisher's one (is a subscriber's video button)
          // it type = 'screen'
          //   don't do anything
          var isMicrophone = name === 'audio' && isPublisher;
          var isSubscribeToVideo = name === 'video' && !isPublisher;
          if (isMicrophone || isSubscribeToVideo) {
            Utils.sendEvent('roomController:userChangeStatus', { status: newStatus, name: name });
            if (isMicrophone) {
              sendSignalMuteAll(false, true);
              _sharedStatus.roomMuted = false;
            }
          }
        }
      }
    },
    videoSwitch: function (evt) {
      changeSubscriberStatus('video', evt.detail.status);
    },
    muteAllSwitch: function (evt) {
      var roomMuted = evt.detail.status;
      _sharedStatus.roomMuted = roomMuted;
      setAudioStatus(roomMuted);
      sendSignalMuteAll(roomMuted, false);
    },
    dialOut: function (evt) {
      if (evt.detail) {
        var phoneNumber = evt.detail.replace(/\D/g, '');
        if (requireGoogleAuth && (googleAuth.isSignedIn.get() !== true)) {
          googleAuth.signIn().then(function () {
            document.body.data('google-signed-in', 'true');
            dialOut(phoneNumber);
          });
        } else {
          dialOut(phoneNumber);
        }
      }
    },
    addToCall: function () {
      if (isMobile() && navigator.share) {
        showMobileShareUrl();
      } else {
        showAddToCallModal();
      }
    },
    togglePublisherAudio: function (evt) {
      var newStatus = evt.detail.hasAudio;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('audio') !== newStatus) {
        otHelper.togglePublisherAudio(newStatus);
      }
    },
    togglePublisherVideo: function (evt) {
      var newStatus = evt.detail.hasVideo;
      if (!otHelper.isPublisherReady || otHelper.publisherHas('video') !== newStatus) {
        otHelper.togglePublisherVideo(newStatus);
      }
    },
    setRoomLockState: function (evt) {
      var state = evt.detail;
      var data = {
        userName,
        token,
        state,
        roomURI
      };

      Request.sendLockingOperation(data).then(() => sendSignalLock(state));
    }
  };

  var setAudioStatus = function (switchStatus) {
    otHelper.isPublisherReady && viewEventHandlers.buttonClick({
      detail: {
        streamId: 'publisher',
        name: 'audio',
        disableAll: true,
        status: switchStatus
      }
    });
  };

  var sendStatus = function (evt, control, enabled) {
    var stream = evt.stream || evt.target.stream;
    if (!stream) {
      return;
    }

    var id = stream.streamId;
    stream = subscriberStreams[id];
    var buttonInfo = !stream ? publisherButtons[control] : stream.buttons[control];
    buttonInfo.enabled = !!enabled;

    Utils.sendEvent('roomController:' + control, {
      id: id,
      reason: evt.reason,
      enabled: buttonInfo.enabled
    });
  };

  var _subscriberHandlers = {
    videoDisabled: function (evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video');
      sendVideoEvent(evt.target.stream);
    },
    videoEnabled: function (evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video', true);
      sendVideoEvent(evt.target.stream);
    },
    disconnected: function (evt) {
      Utils.sendEvent('roomController:disconnected', {
        id: evt.target.stream.streamId
      });
    },
    connected: function (evt) {
      Utils.sendEvent('roomController:connected', {
        id: evt.target.stream.streamId
      });
    }
  };

  var _allHandlers = {
    connectionCreated: function () {
      RoomView.participantsNumber = ++numUsrsInRoom;
    },
    connectionDestroyed: function () {
      RoomView.participantsNumber = --numUsrsInRoom;
    },
    sessionConnected: function () {
      Utils.sendEvent('roomController:sessionConnected');
    },
    sessionDisconnected: function () {
      // The client has disconnected from the session.
      // This event may be dispatched asynchronously in response to a successful
      // call to the disconnect() method of the Session object.
      // The event may also be disptached if a session connection is lost
      // inadvertantly, as in the case of a lost network connection.
      numUsrsInRoom = 0;
      Utils.sendEvent('roomController:sessionDisconnected');
      subscriberStreams = {};
    },
    streamCreated: function (evt) {
      publisherReady.then(function () {
        // A new stream, published by another client, has been created on this
        // session. For streams published by your own client, the Publisher object
        // dispatches a streamCreated event. For a code example and more details,
        // see StreamEvent.
        var stream = evt.stream;
        // SIP call streams have no video.
        var streamVideoType = stream.videoType || 'noVideo';

        var connectionData;
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

        var streamId = stream.streamId;
        stream.phoneNumber = stream.isSip && stream.name;
        if (stream.isSip) {
          stream.name = 'Invited Participant';
        }

        subscriberStreams[streamId] = {
          stream: stream,
          buttons: new SubscriberButtons(streamVideoType, stream.phoneNumber)
        };

        var subOptions = subscriberOptions[streamVideoType];
        var enterWithVideoDisabled = streamVideoType === 'camera' && _disabledAllVideos;

        _sharedStatus = RoomStatus.get(STATUS_KEY);

        var subsDOMElem = RoomView.createStreamView(streamId, {
          name: stream.name,
          type: stream.videoType,
          controlElems: subscriberStreams[streamId].buttons
        });

        subOptions.subscribeToVideo = !enterWithVideoDisabled;

        /* Use ResizeSensor instead of mutationObserver
        // We want to observe the container where the actual suscriber will live
        var subsContainer = LayoutManager.getItemById(streamId);
        subsContainer && _mutationObserver &&
          _mutationObserver.observe(subsContainer, { attributes: true });
        */

        subscriberStreams[streamId].subscriberPromise =
          otHelper.subscribe(evt.stream, subsDOMElem, subOptions, {}, enableAnnotations)
            .then(function (subscriber) {
              if (streamVideoType === 'screen') {
                enableAnnotations && Utils.sendEvent('roomController:annotationStarted');
                var subContainer = subscriber.element.parentElement;
                Utils.sendEvent('layoutView:itemSelected', {
                  item: subContainer
                });
                return subscriber;
              }

              Object.keys(_subscriberHandlers).forEach(function (name) {
                subscriber.on(name, _subscriberHandlers[name]);
              });
              if (enterWithVideoDisabled) {
                pushSubscriberButton(streamId, 'video', true);
              }

              new ResizeSensor(subsDOMElem, function () { // eslint-disable-line no-new
                var subsDimension = {
                  width: subsDOMElem.clientWidth,
                  height: subsDOMElem.clientHeight
                };
                otHelper.setPreferredResolution(subscriber, null, subsDimension, null, null);
              });

              sendVideoEvent(evt.stream);
              return subscriber;
            }, function (error) {
              debug.error('Error susbscribing new participant. ' + error.message);
            });
      });
    },
    streamDestroyed: function (evt) {
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
      var stream = evt.stream;
      if (stream.videoType === 'screen') {
        Utils.sendEvent('roomController:annotationEnded');
      }
      RoomView.deleteStreamView(stream.streamId);
      subscriberStreams[stream.streamId] = null;
    },
    streamPropertyChanged: function (evt) {
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
    archiveStarted: function (evt) {
      // Dispatched when an archive recording of the session starts
      Utils.sendEvent('archiving', {
        status: 'started',
        id: evt.id
      });
    },
    archiveStopped: function () {
      // Dispatched when an archive recording of the session stops
      Utils.sendEvent('archiving', { status: 'stopped' });
    },
    'signal:roomLocked': function (evt) {
      var roomState = JSON.parse(evt.data).status;
      Utils.sendEvent('roomController:roomLocked', roomState); 
    },
    'signal:muteAll': function (evt) {
      var statusData = JSON.parse(evt.data);
      var muteAllSwitch = statusData.status;
      var onlyChangeSwitch = statusData.onlyChangeSwitch;
      // onlyChangeSwitch is true when the iOS app sends a false muteAll signal.
      if (onlyChangeSwitch) {
        return;
      }

      var setNewAudioStatus = function (isMuted) {
        if (_sharedStatus.roomMuted !== isMuted) {
          return;
        }
        setAudioStatus(isMuted);
      }.bind(undefined, muteAllSwitch);

      if (!otHelper.isMyself(evt.from)) {
        _sharedStatus.roomMuted = muteAllSwitch;
        if (muteAllSwitch) {
          setAudioStatus(muteAllSwitch);
          Utils.sendEvent('roomController:roomMuted', { isJoining: false });
        } else {
          RoomView.showConfirmChangeMicStatus(muteAllSwitch).then(setNewAudioStatus);
        }
      }
    },
    'signal:archives': function (evt) {
      Utils.sendEvent('roomController:archiveUpdates', evt);
    }
  };

  function showMobileShareUrl() {
    navigator.share({
      title: 'Invite Participant',
      url: location.href
    })
      .then(function () { console.log('Successful share'); })
      .catch(function (error) { console.log('Error sharing', error); });
  }

  function addClipBoardFeature(selector) {
    const inviteLinkBtn = document.getElementById('copyInviteLinkBtn');
    const inputElem = document.getElementById('current-url');
    if (inputElem && inputElem.value) {
      navigator.clipboard.writeText(inputElem.value.trim())
        .then(() => {
          if (inviteLinkBtn.innerText !== 'Copied!') {
            const originalText = inviteLinkBtn.innerText;
            inviteLinkBtn.innerText = 'Copied!';
            setTimeout(() => {
              Modal.hide(selector);
              inviteLinkBtn.innerText = originalText;
            }, 2000)
          }
        });
    }
  }

  function showAddToCallModal() {
    var selector = '.add-to-call-modal';
    return Modal.show(selector).then(function () {
      return new Promise(function (resolve) {
        var enterButton = document.querySelector(selector + ' button');
        enterButton && enterButton.addEventListener('click', function onClicked(event) {
          event.preventDefault();
          enterButton.removeEventListener('click', onClicked);
          if (enterButton.id = "copyInviteLinkBtn") {
            addClipBoardFeature(selector);
          } else {
            Modal.hide(selector);
          }
          resolve();
      });
    });
  });
}

  function getRoomParams() {
    if (!exports.RoomController) {
      throw new Error('Room Controller is not defined. Missing script tag?');
    }

    // pathName should be /room/<roomURI>[?username=<userName>]
    var pathName = document.location.pathname.split('/');

    if (!pathName || pathName.length < 2) {
      throw new Error('Invalid path');
    }

    var roomName = '';
    var roomURI = '';
    var length = pathName.length;
    if (length > 0) {
      roomURI = pathName[length - 1];
    }
    roomName = Utils.decodeStr(roomURI);

    // Recover user identifier
    var params = Utils.parseSearch(document.location.search);
    var usrId = params.getFirstValue('userName');
    resolutionAlgorithm = params.getFirstValue('resolutionAlgorithm');
    debugPreferredResolution = params.getFirstValue('debugPreferredResolution');
    enableHangoutScroll = params.getFirstValue('enableHangoutScroll') !== undefined;

    return PrecallController.showCallSettingsPrompt(roomName, usrId, otHelper)
    .then(function (info) {
      info.roomURI = roomURI;
      RoomView.showRoom();
      RoomView.roomName = roomName;
      RoomView.roomURI = roomURI;
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
      .then(function (aRoomInfo) {
        if (!(aRoomInfo && aRoomInfo.token && aRoomInfo.sessionId &&
              aRoomInfo.apiKey && aRoomInfo.username) ||
              (aRoomInfo.enableArchiveManager &&
              (!aRoomInfo.firebaseToken || !aRoomInfo.firebaseURL))) {
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

  var modules = [
    '/js/components/htmlElems.js',
    '/js/helpers/resolutionAlgorithms.js',
    '/js/helpers/opentok-network-test.js',
    '/js/itemsHandler.js',
    '/js/layoutView.js',
    '/js/layouts.js',
    '/js/layoutManager.js',
    '/js/roomView.js',
    '/js/roomStatus.js',
    '/js/chatController.js',
    '/js/recordingsController.js',
    '/js/precallController.js',
    '/js/layoutMenuController.js',
    '/js/screenShareController.js',
    '/js/feedbackController.js',
    '/js/googleAuth.js',
    '/js/phoneNumberController.js',
    '/js/vendor/ResizeSensor.js'
  ];

  var init = function () {
    LazyLoader.load(modules)
    .then(function () {
      return PrecallController.init();
    })
    .then(function () {
      return LazyLoader.load('/js/helpers/OTHelper.js');
    })
    .then(function () {
      otHelper = new OTHelper({});
      exports.otHelper = otHelper;
    })
    .then(getRoomParams)
    .then(getRoomInfo)
    .then(function (aParams) {
      var loadAnnotations = Promise.resolve();
      if (enableAnnotations) {
        exports.OTKAnalytics = exports.OTKAnalytics ||
          function () {
            return {
              addSessionInfo: function () {},
              logEvent: function (a, b) {
                console.log(a, b); // eslint-disable-line no-console
              }
            };
          };

        loadAnnotations = LazyLoader.load([
          'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js',
          '/js/vendor/opentok-annotation.js'
        ]);
      }
      return loadAnnotations.then(function () { return aParams; });
    })
  .then(function (aParams) {
    Utils.addEventsHandlers('roomView:', viewEventHandlers, exports);
    Utils.addEventsHandlers('roomStatus:', roomStatusHandlers, exports);
    RoomView.init(enableHangoutScroll, enableArchiveManager, enableSip);
    // Init this controller before connect to the session
    // to start receiving signals about archives updates
    RecordingsController.init(enableArchiveManager);

    roomURI = aParams.roomURI;
    userName = aParams.username ? aParams.username.substring(0, 1000) : '';
    userName = Utils.htmlEscape(userName.substring(0, 25));
    token = aParams.token;

    var sessionInfo = {
      apiKey: aParams.apiKey,
      sessionId: aParams.sessionId,
      token: aParams.token
    };

    var connect = otHelper.connect.bind(otHelper, sessionInfo);
    
    var waitForConnectionCount = function() {
      return new Promise(function (resolve) {
        if (!maxUsersPerRoom) {
          return resolve();
        }
        return setTimeout(function () {
          if (numUsrsInRoom > maxUsersPerRoom) {
            Utils.sendEvent('roomController:meetingFullError');
            return;
          }
          resolve();
        }, 500);
      });
    }

    RoomView.participantsNumber = 0;

    _allHandlers = RoomStatus.init(_allHandlers, { room: _sharedStatus });

    if (enableSip && requireGoogleAuth) {
      GoogleAuth.init(aParams.googleId, aParams.googleHostedDomain, function (aGoogleAuth) {
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
        .then(function () {
          var publisherElement = RoomView.createStreamView('publisher', {
            name: userName,
            type: 'publisher'
          });
          // If we have all audios disabled, we need to set the button status
          // and don't publish audio
          if (_sharedStatus.roomMuted) {
            // Set visual status of button
            sendStatus({
              stream: {
                streamId: 'Publisher'
              },
              reason: 'publishAudio'
            }, 'audio', false);
            // Don't publish audio
            publisherOptions.publishAudio = false;
          }
          publisherOptions.name = userName;
          // Remember previous device selection in IE:
          if (Utils.isIE()) {
            publisherOptions.usePreviousDeviceSelection = true;
          }
          return otHelper.publish(publisherElement, publisherOptions, {}).then(function () {
            setPublisherReady();
            RoomView.showPublisherButtons(publisherOptions);
          }).catch(function (errInfo) {
            if (errInfo.error.name === 'OT_CHROME_MICROPHONE_ACQUISITION_ERROR') {
              Utils.sendEvent('roomController:chromePublisherError');
              otHelper.disconnect();
            }
          });
        })
        .then(function () {
          ScreenShareController.init(userName, aParams.chromeExtId, otHelper, enableAnnotations);
          FeedbackController.init(otHelper, aParams.reportIssueLevel);
          PhoneNumberController.init();
          Utils.sendEvent('roomController:controllersReady');
        })
        .catch(function (error) {
          debug.error('Error Connecting to room. ' + error.message);
        });
    });
  };

  var RoomController = {
    init: init
  };

  exports.RoomController = RoomController;
}(this));
