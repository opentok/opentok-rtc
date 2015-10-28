!function(exports) {
  'use strict';

  var debug =
    new Utils.MultiLevelLogger('roomController.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  var numUsrsInRoom = 0;

  var MAIN_PAGE = '/index.html';

  var userName = null,
      roomName = null;

  var publisherOptions = {
    insertMode: 'append',
    width:'100%',
    height: '100%',
    showControls: false,
    style: {
      audioLevelDisplayMode: 'off',
      buttonDisplayMode: 'on',
      nameDisplayMode: 'on',
      videoDisabledDisplayMode: 'on',
      showArchiveStatus: false
    }
  };

  var subscriberOptions = {
    'camera': {
      height: '100%',
      width: '100%',
      inserMode: 'append',
      showControls: false,
      style: {
        audioLevelDisplayMode: 'off',
        buttonDisplayMode: 'on',
        nameDisplayMode: 'on',
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
        dataIcon: isScreenSharing ? 'desktop' : 'camera',
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
      }
    }

    return buttons;
  };

  var publisherButtons = {
    video: {
      context: 'OTHelper',
      action: 'togglePublisherVideo',
      enabled: true
    },
    audio: {
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
      var streamId = evt.detail.streamId,
          name = evt.detail.name,
          buttonInfo = null,
          args = null;

      if (streamId) {
        var stream = subscriberStreams[streamId];
        if (!stream) {
          debug.error('Got an event from an nonexistent stream');
          return;
        }
        buttonInfo = stream.buttons[name];
        args = [stream.stream, !buttonInfo.enabled];
        // BUG xxxx - We don't receive videoDisabled/videoEnabled events when
        // stopping/starting the screen sharing video
        // BUG yyyy - We don't receive any event when mute/unmute the audio in local streams
        if (evt.detail.streamType === 'screen' || name === 'audio') {
          // so we assume the operation was performed properly and change the UI status
          sendStatus({ stream: stream.stream }, name, !buttonInfo.enabled);
        }
      } else {
        buttonInfo = publisherButtons[name];
        args = [!buttonInfo.enabled];
      }

      if (!buttonInfo) {
        debug.error('Got an event from an unknown button!');
        return;
      }

      var obj = exports[buttonInfo.context];
      obj[buttonInfo.action].apply(obj, args);
    }
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
    'audioLevelUpdated': function(evt) {
      var stream = evt.target.stream;
      if (!stream) {
        return;
      }

      Utils.sendEvent('roomController:audioLevelUpdated', {
        id: stream.streamId,
        level: evt.audioLevel
      });
    },
    'videoDisabled': function(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video');
    },
    'videoEnabled': function(evt) {
      evt.reason === 'subscribeToVideo' && sendStatus(evt, 'video', true);
    }
  };

  var _allHandlers = {
    'sessionConnected': function(evt) {
      // The page has connected to an OpenTok session.
      // This event is dispatched asynchronously in response to a successful
      // call to the connect() method of a Session object.
      debug.log('!!! room TODO - sessionConnected');
    },
    'connectionCreated': function(evt) {
      // Dispatched when an new client (including your own) has connected to the
      // session, and for every client in the session when you first connect
      // Session object also dispatches a sessionConnected evt when your local
      // client connects
      debug.log('!!! room TODO - connectionCreated');
    },
    'connectionDestroyed': function(evt) {
      // A client, other than your own, has disconnected from the session
      debug.log('!!! room TODO - connectionDestroyed');
    },
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

      var subsDiv =
        RoomView.createSubscriberView(streamId, stream.videoType,
                                      subscriberStreams[streamId].buttons);

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
      debug.log('!!! room TODO - streamDestroyed');
      numUsrsInRoom--;
      RoomView.participantsNumber = numUsrsInRoom;

      var stream = evt.stream;
      RoomView.deleteSubscriberView(stream.streamId);
      subscriberStreams[stream.streamId] = null;
      var subscribers = this.getSubscribersForStream(stream);
      subscribers.forEach(function(subscriber) {
        Object.keys(_subscriberHandlers).forEach(function(name) {
          subscriber.off(name, _subscriberHandlers[name]);
        });
      });
    },
    'streamPropertyChanged': function(evt) {
      if (OTHelper.myStreamId !== evt.stream.id) {
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
      document.querySelector(selector + ' header').textContent = roomName;
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

  function setScreenSharingStatus(status) {
    Utils.sendEvent('roomController:changeScreenSharingStatus', status);
  }

  function getRoomInfo(aRoomParams) {
    return Request.
      getRoomInfo(aRoomParams).
      then(function(aRoomInfo) {
        if (!(aRoomInfo && aRoomInfo.token && aRoomInfo.sessionId
            && aRoomInfo.apiKey && aRoomInfo.username
            && aRoomInfo.firebaseToken && aRoomInfo.firebaseURL)) {
          debug.error('Error getRoomParams [' + aRoomInfo +
                      ' without correct response');
          throw new Error('Error getting room parameters');
        }
        aRoomInfo.roomName = aRoomParams.roomName;
        return aRoomInfo;
      });
  }

  var init = function() {
    LazyLoader.dependencyLoad([
      '/js/components/htmlElems.js',
      '/js/helpers/OTHelper.js',
      '/js/layout.js',
      '/js/roomView.js',
      '/js/chatController.js',
      '/js/recordingsController.js',
      '/js/screenSharingController.js',
      '/js/publisher.js'
    ]).
    then(getRoomParams).
    then(getRoomInfo).
    then(function(aParams) {
      Utils.addEventsHandlers('roomView:', viewEventHandlers, exports);
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

      RoomView.userName = userName;
      // Room's name is set by server, we don't need to do this, but
      // perphaps it would be convenient
      // RoomView.roomName = aParams.roomName;
      RoomView.participantsNumber = 0;

      publisherOptions.name = userName;
      var publish = OTHelper.publish.bind(OTHelper, RoomView.publisherId,
                                          publisherOptions);
      ChatController.
        init(aParams.roomName, userName, _allHandlers).
        then(connect).
        then(publish).
        then(function() {
          RoomView.participantsNumber = ++numUsrsInRoom;
          Publisher.init();
          RecordingsController.init(aParams.firebaseURL, aParams.firebaseToken);
          ScreenSharingController.init(userName, aParams.chromeExtId);
        }).
        catch(function(error) {
          debug.error('Error Connecting to room. ' + error.message);
        });
    });
  };

  var RoomController = {
    init: init,
    setScreenSharingStatus: setScreenSharingStatus
  };

  exports.RoomController = RoomController;

}(this);
