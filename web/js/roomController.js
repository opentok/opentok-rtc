!function(exports) {
  'use strict';

  var debug =
    new Utils.MultiLevelLogger('roomController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  var numUsrsInRoom = 0;

  var publisherReady = Promise.resolve();

  var MAIN_PAGE = '/index.html';
  var STATUS_KEY= 'room';
  var _sharedStatus = {
    roomMuted: false
  };

  var userName = null,
      roomName = null;

  var publisherOptions = {
    insertMode: 'append',
    width:'100%',
    height: '100%',
    showControls: true,
    style: {
      audioLevelDisplayMode: 'on',
      buttonDisplayMode: 'off',
      nameDisplayMode: 'off',
      videoDisabledDisplayMode: 'on',
      showArchiveStatus: false
    }
  };

  var subscriberOptions = {
    'camera': {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: true,
      style: {
        audioLevelDisplayMode: 'on',
        buttonDisplayMode: 'off',
        nameDisplayMode: 'off',
        videoDisabledDisplayMode: 'auto'
      }
    },
    'screen': {
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
    }
  };

  var SubscriberButtons = function(streamVideType) {
    var isScreenSharing = streamVideType === 'screen';

    var buttons = {
      video: {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: isScreenSharing ? 'desktop' : 'video',
        eventName: 'click',
        context: 'OTHelper',
        action: 'toggleSubscribersVideo',
        enabled: true
      }
    };

    if (!isScreenSharing) {
      buttons.audio = {
        eventFiredName: 'roomView:buttonClick',
        dataIcon: 'audio',
        eventName: 'click',
        context: 'OTHelper',
        action: 'toggleSubscribersAudio',
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
      context: 'OTHelper',
      action: 'togglePublisherVideo',
      enabled: true
    },
    audio: {
      eventFiredName: 'roomView:buttonClick',
      dataIcon: 'mic',
      eventName: 'click',
      context: 'OTHelper',
      action: 'togglePublisherAudio',
      enabled: true
    }
  };

  var subscriberStreams = {
  };

  var sendArchivingOperation = function(operation) {
    var data = {
      userName: userName,
      roomName: roomName,
      operation: operation
    };

    Request.sendArchivingOperation(data).
      then(function(response) {
        debug.log(response);
      });
  };

  var roomStatusHandlers = {
    'updatedRemotely': function(evt) {
      publisherReady.then(function() {
        _sharedStatus = RoomStatus.get(STATUS_KEY);
        var roomMuted = _sharedStatus.roomMuted;
        setAudioStatus(roomMuted);
        Utils.sendEvent('roomController:roomMuted', { status: roomMuted });
      });
    }
  };

  var changeSubscriberStatus = function(name, status) {
    Object.keys(subscriberStreams).forEach(function(aStreamId) {
      if (subscriberStreams[aStreamId] &&
          subscriberStreams[aStreamId].stream.videoType === 'camera') {
        viewEventHandlers.buttonClick({
          detail: {
            streamId: aStreamId,
            name: name,
            disableAll: true,
            status: status
          }
        });
      }
    });
  };

  var viewEventHandlers = {
    'endCall': function(evt) {
      var url = window.location.origin + MAIN_PAGE;
      window.location = url;
    },
    'startArchiving': function(evt) {
      sendArchivingOperation((evt.detail && evt.detail.operation) || 'startComposite');
    },
    'stopArchiving': function(evt) {
      sendArchivingOperation('stop');
    },
    'buttonClick': function(evt) {
      var streamId = evt.detail.streamId;
      var name = evt.detail.name;
      var disableAll = !!evt.detail.disableAll;
      var switchStatus = evt.detail.status;
      var buttonInfo = null;
      var args = [];
      var newStatus;

      if (streamId !== 'publisher') {
        var stream = subscriberStreams[streamId];
        if (!stream) {
          debug.error('Got an event from an nonexistent stream');
          return;
        }
        buttonInfo = stream.buttons[name];
        args.push(stream.stream);
        newStatus = !buttonInfo.enabled;
        // BUG xxxx - We don't receive videoDisabled/videoEnabled events when
        // stopping/starting the screen sharing video
        // OPENTOK-26021 - We don't receive any event when mute/unmute the audio in local streams
        if (evt.detail.streamType === 'screen' || name === 'audio') {
          // so we assume the operation was performed properly and change the UI status
          sendStatus({ stream: stream.stream }, name, newStatus);
        }
      } else {
        buttonInfo = publisherButtons[name];
        newStatus = !buttonInfo.enabled;
      }

      if (!buttonInfo) {
        debug.error('Got an event from an unknown button!');
        return;
      }

      args.push(newStatus);

      if (!disableAll || disableAll && switchStatus !== newStatus) {
        var obj = exports[buttonInfo.context];
        obj[buttonInfo.action].apply(obj, args);
        if (!disableAll) {
          Utils.sendEvent('roomController:userChangeStatus', { status: newStatus, name: name });
          _sharedStatus.roomMuted = switchStatus;
        }
      }
    },
    'videoSwitch': function(evt) {
      changeSubscriberStatus('video', evt.detail.status);
    },
    'muteAllSwitch': function(evt) {
      var roomMuted = evt.detail.status;
      _sharedStatus.roomMuted = roomMuted;
      setAudioStatus(roomMuted);
    }
  };

  var setAudioStatus = function(switchStatus) {
    OTHelper.isPublisherReady && viewEventHandlers.buttonClick({
      detail: {
        streamId: 'publisher',
        name: 'audio',
        disableAll: true,
        status: switchStatus
      }
    });
  };

  var sendStatus = function(evt, control, enabled) {
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
    'videoDisabled': function(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video');
    },
    'videoEnabled': function(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video', true);
    }
  };

  var _allHandlers = {
    'sessionDisconnected': function(evt) {
      // The client has disconnected from the session.
      // This event may be dispatched asynchronously in response to a successful
      // call to the disconnect() method of the Session object.
      // The event may also be disptached if a session connection is lost
      // inadvertantly, as in the case of a lost network connection.

      // The default behavior is that all Subscriber objects are unsubscribed
      // and removed from the HTML DOM. Each Subscriber object dispatches a
      // destroyed event when the element is removed from the HTML DOM.
      // If you call the preventDefault() method in the event listener for the
      // sessionDisconnect event, the default behavior is prevented, and you
      // can, optionally, clean up Subscriber objects using your own code.
      numUsrsInRoom--;
      RoomView.participantsNumber = numUsrsInRoom;
    },
    'streamCreated': function(evt) {
      // A new stream, published by another client, has been created on this
      // session. For streams published by your own client, the Publisher object
      // dispatches a streamCreated event. For a code example and more details,
      // see StreamEvent.
      var stream = evt.stream;
      var streamVideoType = stream.videoType;

      if (!(streamVideoType === 'camera' || streamVideoType === 'screen')) {
        debug.error('Stream not contemplated: ' + stream.videoType);
        return;
      }

      var streamId = stream.streamId;
      subscriberStreams[streamId] = {
        stream: stream,
        buttons: new SubscriberButtons(streamVideoType)
      };

      var subOptions = subscriberOptions[streamVideoType];

      _sharedStatus = RoomStatus.get(STATUS_KEY);

      var subsDiv = RoomView.createStreamView(streamId, {
        name: stream.name,
        type: stream.videoType,
        controlElems: subscriberStreams[streamId].buttons
      });

      OTHelper.subscribe(evt.stream, subsDiv, subOptions).
        then(function(subscriber) {
          if (streamVideoType === 'screen') {
            return;
          }

          numUsrsInRoom++;
          debug.log('New subscriber, total:', numUsrsInRoom);
          RoomView.participantsNumber = numUsrsInRoom;
          Object.keys(_subscriberHandlers).forEach(function(name) {
            subscriber.on(name, _subscriberHandlers[name]);
          });
        }, function(error) {
          debug.error('Error susbscribing new participant. ' + error.message);
        });
    },
    'streamDestroyed': function(evt) {
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
      numUsrsInRoom--;
      RoomView.participantsNumber = numUsrsInRoom;

      var stream = evt.stream;
      RoomView.deleteStreamView(stream.streamId);
      subscriberStreams[stream.streamId] = null;
      var subscribers = this.getSubscribersForStream(stream);
      subscribers.forEach(function(subscriber) {
        Object.keys(_subscriberHandlers).forEach(function(name) {
          subscriber.off(name, _subscriberHandlers[name]);
        });
      });
    },
    'streamPropertyChanged': function(evt) {
      if (OTHelper.publisherId !== evt.stream.id) {
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
    'archiveStarted': function(evt) {
      // Dispatched when an archive recording of the session starts
      Utils.sendEvent('archiving', {
        status: 'started',
        id: evt.id
      });
    },
    'archiveStopped': function(evt) {
      // Dispatched when an archive recording of the session stops
      Utils.sendEvent('archiving', { status: 'stopped' });
    },
    'signal:chat': function(evt) {
      RoomView.toggleChatNotification();
    }
  };

  function showUserNamePrompt(roomName) {
    return LazyLoader.dependencyLoad([
      '/js/components/modal.js'
    ]).then(function() {
      var selector = '.user-name-modal';
      document.querySelector(selector + ' header .room-name').textContent = roomName;
      return Modal.show(selector).then(function() {
        return new Promise(function(resolve, reject) {
          var enterButton = document.querySelector(selector + ' button');
          enterButton.addEventListener('click', function onClicked(event) {
            event.preventDefault();
            enterButton.removeEventListener('click', onClicked);
            return Modal.hide(selector).
              then(function() {
                resolve(document.querySelector(selector + ' input').value.trim());
            });
          });
        });
      });
    });
  }

  function getReferrerURL() {
    var referrerURL = '';

    try {
      referrerURL = new URL(document.referrer);
    } catch(ex) {

    }

    return referrerURL;
  }

  function getRoomParams() {
    if (!exports.RoomController) {
      throw new Error("Room Controller is not defined. Missing script tag?");
    }

    // pathName should be /room/<roomName>[?username=<userName>]
    debug.log(document.location.pathname);
    debug.log(document.location.search);
    var pathName = document.location.pathname.split('/');

    if (!pathName || pathName.length < 2) {
      debug.log('This should not be happen, it\'s not possible to do a ' +
                'request without /room/<roomName>[?username=<usr>]');
      throw new Error('Invalid path');
    }

    var roomName = '';
    var length = pathName.length;
    if (length > 0) {
      roomName = pathName[length - 1];
    }

    // Recover user identifier
    var search = document.location.search;
    var usrId = '';
    if (search && search.length > 0) {
      search = search.substring(1);
      usrId = search.split('=')[1];
    }

    var info = {
      username: usrId,
      roomName: roomName
    };

    if (usrId || (window.location.origin === getReferrerURL().origin)) {
      return Promise.resolve(info);
    } else {
      return showUserNamePrompt(roomName).then(function(userName) {
        info.username = userName;
        return info;
      });
    }
  }

  function getRoomInfo(aRoomParams) {
    return Request.
      getRoomInfo(aRoomParams).
      then(function(aRoomInfo) {
        if (!(aRoomInfo && aRoomInfo.token && aRoomInfo.sessionId
            && aRoomInfo.apiKey && aRoomInfo.username
            && aRoomInfo.firebaseToken && aRoomInfo.firebaseURL)) {
          debug.error('Error getRoomParams [', aRoomInfo,
                      '] without correct response');
          throw new Error('Error getting room parameters');
        }
        aRoomInfo.roomName = aRoomParams.roomName;
        return aRoomInfo;
      });
  }

  var init = function() {
    LazyLoader.load([
      '/js/components/htmlElems.js',
      '/js/helpers/OTHelper.js',
      '/js/itemsHandler.js',
      '/js/layoutView.js',
      '/js/layouts.js',
      '/js/layoutManager.js',
      '/js/roomView.js',
      '/js/roomStatus.js',
      '/js/chatController.js',
      '/js/recordingsController.js',
      '/js/layoutMenuController.js',
      '/js/screenShareController.js'
    ]).
    then(getRoomParams).
    then(getRoomInfo).
    then(function(aParams) {
      Utils.addEventsHandlers('roomView:', viewEventHandlers, exports);
      Utils.addEventsHandlers('roomStatus:', roomStatusHandlers, exports);

      RoomView.init();
      roomName = aParams.roomName;
      userName = aParams.username ?
                  (aParams.username.length > 1000 ?
                   aParams.username.substring(0, 1000) :
                   aParams.username) :
                  '';

      var connect =
        OTHelper.connectToSession.bind(OTHelper, aParams.apiKey,
                                       aParams.sessionId, aParams.token);

      // Room's name is set by server, we don't need to do this, but
      // perphaps it would be convenient
      // RoomView.roomName = aParams.roomName;
      RoomView.participantsNumber = 0;

      _allHandlers = RoomStatus.init(userName, _allHandlers, { room: _sharedStatus });

      ChatController.
        init(aParams.roomName, userName, _allHandlers).
        then(connect).
        then(LayoutMenuController.init).
        then(function() {
          var publisherElement = RoomView.createStreamView('publisher', {
            name: userName,
            type: 'publisher',
            controlElems: publisherButtons
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
            Utils.sendEvent('roomController:joinRoomMuted');
          }
          publisherOptions.name = userName;
          publisherReady = OTHelper.publish(publisherElement, publisherOptions);
          return publisherReady;
        }).
        then(function() {
          RoomView.participantsNumber = ++numUsrsInRoom;
          RecordingsController.init(aParams.firebaseURL, aParams.firebaseToken);
          ScreenShareController.init(userName, aParams.chromeExtId);
        }).
        catch(function(error) {
          debug.error('Error Connecting to room. ' + error.message);
        });
    });
  };

  var RoomController = {
    init: init
  };

  exports.RoomController = RoomController;

}(this);
