!function(global) {
  'use strict';

  var dynamicOTLoad = true;
  var otPromise = Promise.resolve();

  var preReqSources = [
  ];

  // in IE dynamic loading the library doesn't work. For the time being, as a stopgap measure,
  // loading it statically.
  if (dynamicOTLoad) {
    var OPENTOK_API = 'https://static.opentok.com/webrtc/v2/js/opentok.min.js';
    preReqSources.unshift(OPENTOK_API);
  }

  if (preReqSources.length) {
    otPromise = LazyLoader.load(preReqSources);
  }

  var MSG_MULTIPART = 'signal';
  var SIZE_MAX = 7800;

  var HEAD_SIZE =
        JSON.stringify({ _head: { id: 99, seq: 99, tot: 99}, data: "" }).length;
  var USER_DATA_SIZE = SIZE_MAX - HEAD_SIZE;
  var logger =
        new Utils.MultiLevelLogger('OTHelper.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  var otLoaded = otPromise.then(function() {
    var hasRequirements = OT.checkSystemRequirements();
    logger.log('checkSystemRequirements:', hasRequirements);
    if (!hasRequirements) {
      OT.upgradeSystemRequirements();
      throw new Error('Unsupported browser, probably needs upgrade');
    }
    return;
  });

  // Done intentionally (to use string codes for our error codes)
  // so as to not overwrite existing OT library codes
  var PUB_SCREEN_ERROR_CODES = {
    accessDenied: 1500,
    extNotInstalled: 'OT0001',
    extNotRegistered: 'OT0002',
    notSupported: 'OT0003',
    errPublishingScreen: 'OT0004'
  };

  function getScreenShareCapability() {
    return new Promise(function(resolve, reject) {
      OT.checkScreenSharingCapability(function(response) {
        if (!response.supported) {
          reject({
            code: PUB_SCREEN_ERROR_CODES.notSupport,
            message: 'This browser does not support screen sharing.'
          });
        } else if (response.extensionRegistered === false) {
          reject({
            code: PUB_SCREEN_ERROR_CODES.extNotRegistered,
            message: 'This browser does not support screen sharing.'
          });
        } else if (response.extensionRequired !== undefined &&
                   response.extensionInstalled === false) {
          reject({
            code: PUB_SCREEN_ERROR_CODES.extNotInstalled,
            message: 'Please install the screen sharing extension and load your app over https.'
          });
        } else {
          resolve();
        }
      });
    });
  }

  function registerScreenShareExtension(aParams, version) {
    Object.keys(aParams).forEach(function(aKey) {
      OT.registerScreenSharingExtension(aKey, aParams[aKey], version || 2);
    });
  }

  var sendSignal = (function() {
    var messageOrder = 0;
    function composeSegment(aMsgId, aSegmentOrder, aTotalSegments, aUsrMsg) {
      var obj = {
        type: aUsrMsg.type,
        data: JSON.stringify({
          _head: {
            id: aMsgId,
            seq: aSegmentOrder,
            tot: aTotalSegments
          },
          data: aUsrMsg.data ?
            aUsrMsg.data.substr(aSegmentOrder * USER_DATA_SIZE, USER_DATA_SIZE) :
            ''
        })
      };
      if (aUsrMsg.to) {
        obj.to = aUsrMsg.to;
      }
      return obj;
    }

    //
    // Multipart message sending proccess. this is expected to be the actual session
    //
    var sendSignal = function(aType, aMsgData, aTo) {
      var session = this;
      return new Promise(function(resolve, reject) {
        var msg = {
          type: aType,
          data: aMsgData && JSON.stringify(aMsgData)
        };
        var msgId = ++messageOrder;
        var totalSegments = msg.data ? Math.ceil(msg.data.length / USER_DATA_SIZE) : 1;
        var messagesSent = [];
        for (var segmentOrder = 0; segmentOrder < totalSegments; segmentOrder++) {
          var signalData = composeSegment(msgId, segmentOrder, totalSegments, msg);
          if (aTo) {
            signalData.to = aTo;
          }
          messagesSent[segmentOrder] =
            new Promise(function(resolveMessage, rejectMessage) {
              session.signal(signalData, function(error) {
                (error && (rejectMessage(error) || true)) || resolveMessage();
              });
            });
        }
        Promise.all(messagesSent).then(resolve).catch(reject);
      });
    };
    return sendSignal;
  })();

  var receiveMultipartMsg = (function() {
    var _msgPieces = {};

    //
    // Multipart message reception proccess
    //
    function parseMultiPartMsg(aEvt) {
      var dataParsed;
      dataParsed = JSON.parse(aEvt.data);
      return {
        connectionId: aEvt.from.connectionId,
        head: dataParsed._head,
        data: dataParsed.data
      };
    }

    var receiveMultipartMsg = function(aFcClients, aEvt) {
      var parsedMsg = parseMultiPartMsg(aEvt);

      var connection = _msgPieces[parsedMsg.connectionId];
      var newPromise = null;
      // First msg from a client
      if (!connection) {
        connection = {};
        _msgPieces[parsedMsg.connectionId] = connection;
      }

      var msg = connection[parsedMsg.head.id];

      // First piece of a message
      if (!msg) {
        msg = {
          have: 0,
          data: new Array(parsedMsg.head.tot),
          promiseSolver: null
        };
        // Get a new solver
        newPromise = new Promise(function (resolve, reject) {
          msg.promiseSolver = resolve;
        });
        aFcClients.forEach(function(aFc) {
          newPromise.then(aFc);
        });
        connection[parsedMsg.head.id] = msg;
      }
      // This shouldn't be needed since we can only set one handler per signal
      // now, but doesn't hurt
      if (!msg.data[parsedMsg.head.seq]) {
        msg.data[parsedMsg.head.seq] = parsedMsg.data;
        msg.have++;
      }
      // If we have completed the message, fulfill the promise
      if (msg.have >= parsedMsg.head.tot ) {
        aEvt.data = msg.data.join('');
        msg.promiseSolver(aEvt);
        delete connection[parsedMsg.head.id];
      }
    };

    return receiveMultipartMsg;

    // END Reception multipart message proccess
  })();

  // We need to intercept the messages which type is multipart and wait until
  // the message is complete before to send it (launch client event)
  // aHandlers is an array of objects
  function _setHandlers(aBindTo, aReceiver, aHandlers) {
    var _interceptedHandlers = {};

    // First add the handlers removing the ones we want to intercept...
    for(var i = 0; i < aHandlers.length; i++) {
      var _handlers = {};
      Object.
        keys(aHandlers[i]).
        forEach(function(evtName) {
          var handler = aHandlers[i][evtName];
          if (evtName.startsWith(MSG_MULTIPART)) {
            _interceptedHandlers[evtName] = _interceptedHandlers[evtName] || [];
            _interceptedHandlers[evtName].push(handler.bind(aBindTo));
          } else {
            _handlers[evtName] = handler.bind(aBindTo);
          }
        });
      aReceiver.on(_handlers);
    }

    // And then add the intercepted handlers
    Object.
      keys(_interceptedHandlers).
      forEach(function(evtName) {
        _interceptedHandlers[evtName] =
          receiveMultipartMsg.bind(undefined, _interceptedHandlers[evtName]);
      });
    aReceiver.on(_interceptedHandlers);
  }

  // aSessionInfo must have sessionId, apiKey, token
  function OTHelper(aSessionInfo) {
    var _session;
    var _publisher;
    var _publisherInitialized = false;
    var _sessionInfo = aSessionInfo;


    function disconnect() {
      if (_session) {
        _session.disconnect();
      }
    }

    function off() {
      _session && _session.off();
    }

    // aHandlers is either an object with the handlers for each event type
    // or an array of objects
    function connect(aHandlers) {
      var self = this;
      var apiKey = _sessionInfo.apiKey;
      var sessionId = _sessionInfo.sessionId;
      var token = _sessionInfo.token;
      if (!Array.isArray(aHandlers)) {
        aHandlers = [aHandlers];
      }
      return otLoaded.then(function() {
        return new Promise(function(resolve, reject) {
          if (!(apiKey && sessionId && token)) {
            return reject({
              message: 'Invalid parameters received. ' +
                'ApiKey, sessionId and Token are mandatory'
            });
          }
          disconnect();
          _session = OT.initSession(apiKey, sessionId);
          _session.off();

          aHandlers && _setHandlers(self, self.session, aHandlers);

          return _session.connect(token, function(error) {
            if (error) {
              reject(error);
            } else {
              self.sendSignal = sendSignal.bind(_session);
              resolve(_session);
            }
          });
        });
      });
    };

    function removeListener(evtName) {
      _session.off(evtName);
    }

    var _publishOptions;
    // We will use this in case the first publish fails. On the error we will give the caller a
    // promise that will fulfill when/if the publish succeeds at some future time (because of a
    // retry).
    var _solvePublisherPromise;
    var _publisherPromise = new Promise(function(resolve, reject) {
      _solvePublisherPromise = resolve;
    });

    function publish(aDOMElement, aProperties, aHandlers) {
      var self = this;
      _publishOptions = null;
      var propCopy = {};
      Object.keys(aProperties).forEach(function(aKey) {
        propCopy[aKey] = aProperties[aKey];
      });
      return new Promise(function(resolve, reject) {
        function processError(error) {
          _publishOptions = {
            elem: aDOMElement,
            properties: propCopy,
            handlers: aHandlers
          };
          _publisher = null;
          reject({ error: error, publisherPromise: _publisherPromise });
        }

        _publisher = OT.initPublisher(aDOMElement, aProperties, function(error) {
          if (error) {
            processError({
              name: error.name,
              message: 'Error initializing publisher. ' + error.message
            });
           return;
          }
          _session.publish(_publisher, function(error) {
            if (error) {
              processError(error);
            } else {
              _publisherInitialized = true;
              Object.keys(aHandlers).forEach(function(name) {
                _publisher.on(name, aHandlers[name].bind(self));
              });
              _solvePublisherPromise(_publisher);
              resolve(_publisher);
            }
          });
        });
      });
    }

    function subscribeTo(aStream, name, value) {
      var arrSubscribers = _session.getSubscribersForStream(aStream);
      // TODO Currently we expect only one element in arrSubscriber
      Array.isArray(arrSubscribers) && arrSubscribers.forEach(function(subscriber) {
        subscriber['subscribeTo' + name](value);
      });
    }

    function retryPublish() {
      return publish(_publishOptions.elem, _publishOptions.properties, _publishOptions.handlers);
    }

    function publisherReady() {
      return _publisher && _publisherPromise ||
        _publishOptions && retryPublish() ||
        Promise.reject();
    }

    function togglePublisherProperty(aProperty, aValue) {
      publisherReady().then(function(aPublisher) {
        aPublisher['publish' + aProperty](aValue);
      });
    }

    function togglePublisherVideo(aValue) {
      return togglePublisherProperty('Video', aValue);
    }

    function togglePublisherAudio(aValue) {
      return togglePublisherProperty('Audio', aValue);
    }

    function toggleSubscribersVideo(aStream, value) {
      subscribeTo(aStream, 'Video', value);
    }

    function toggleSubscribersAudio(aStream, value) {
      subscribeTo(aStream, 'Audio', value);
    }

    var _screenShare;

    const FAKE_OTK_ANALYTICS = global.OTKAnalytics ||
      function() { return {
          addSessionInfo: function() {},
          logEvent: function(a,b) {
            console.log(a,b);
          }
          };
      };

    // TO-DO: Make this configurable
    const IMAGE_ASSETS = '/images/annotations/';
    const TOOLBAR_BG_COLOR = '#1a99ce';

    function getAnnotation(aDomElement, aOptions) {
      aOptions = aOptions || {};
      var options = {
        session: aOptions.session || _session,
        watchForResize: aOptions.watchForResize || window,
        canvasContainer: aDomElement,
        OTKAnalytics: aOptions.OTKAnalytics || FAKE_OTK_ANALYTICS,
        imageAssets: IMAGE_ASSETS
      };
      return new AnnotationAccPack(options);
    }

    function startAnnotation(aAccPack) {
      if (!aAccPack) {
        return Promise.resolve();
      }
      return aAccPack.start(_session, {
        imageAssets: IMAGE_ASSETS,
        backgroundColor: TOOLBAR_BG_COLOR
      });
    }

    // aElement can be a publisher, a subscriber or a AnnotationPack
    function endAnnotation(aElement) {
      var annPack =  aElement && aElement._ANNOTATION_PACK || aElement;
      annPack && annPack.end && annPack.end();
    }

    function setupAnnotation(aAccPack, aPubSub, aParentElement) {
      if (!aAccPack) {
        return;
      }
      var container = document.getElementById(aPubSub.id);
      var canvasOptions = {
        absoluteParent: aParentElement
      };
      aAccPack.linkCanvas(aPubSub, container, canvasOptions);
      aPubSub._ANNOTATION_PACK = aAccPack;
    }

    function subscribe(aStream, aTargetElement, aProperties, aHandlers, aEnableAnnotation) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var subscriber =
          _session.subscribe(aStream, aTargetElement, aProperties, function(error) {
            error ? reject(error) : resolve(subscriber);
          });
      }).then(function(subscriber) {
        Object.keys(aHandlers).forEach(function(name) {
          subscriber.on(name, aHandlers[name].bind(self));
        });
        subscriber.on('destroyed', function(evt) {
          subscriber.off();
          endAnnotation(subscriber);
        });
        var subsAnnotation =
          (aEnableAnnotation && aStream.videoType === 'screen' && getAnnotation(aTargetElement)) ||
          null;
        return startAnnotation(subsAnnotation).then(function() {
          setupAnnotation(subsAnnotation, subscriber,
                          document.querySelector('.opentok-stream-container'));
          return subscriber;
        });
      });;
    }

    function stopShareScreen() {
      // Should I return something like true/false or deleted element?
      endAnnotation(_screenShare);
      _screenShare && _session.unpublish(_screenShare);
      _screenShare = null;
    }

    function shareScreen(aDOMElement, aProperties, aHandlers, aEnableAnnotation) {
      var self = this;
      var screenShareCapability = getScreenShareCapability();
      if (!Array.isArray(aHandlers)) {
        aHandlers = [aHandlers];
      }

      return screenShareCapability.then(function() {
        return new Promise(function(resolve, reject) {
          var annotationAccPack = aEnableAnnotation && getAnnotation(aDOMElement);
          startAnnotation(annotationAccPack).
            then(function() {
              _screenShare = OT.initPublisher(aDOMElement, aProperties, function(error) {
                if (error) {
                  endAnnotation(annotationAccPack);
                  reject(error);
                } else {
                  _session.publish(_screenShare, function(error) {
                    if (error) {
                      endAnnotation(annotationAccPack);
                      reject({
                        code: PUB_SCREEN_ERROR_CODES.errPublishingScreen,
                        message: error.message
                      });
                    } else {
                      setupAnnotation(annotationAccPack, _screenShare, aDOMElement);
                      resolve(_screenShare);
                    }
                  });
                }
              });
              aHandlers && _setHandlers(self, _screenShare, aHandlers);
            });
        });
      });
    }

    function setPreferredResolution(aSubscriber, aTotalDimension, aSubsDimension,
                                    aSubsNumber, aAlgorithm) {
      var PrefResolutionAlgProv = global.PreferredResolutionAlgorithmProvider;
      if (!PrefResolutionAlgProv) {
        return;
      }
      var algInfo = PrefResolutionAlgProv.getAlg(aAlgorithm);
      var chosenAlgorithm = algInfo.chosenAlgorithm;
      var algorithm = algInfo.algorithm;
      var streamDimension = aSubscriber.stream.videoDimensions;
      var newDimension =
        algorithm(streamDimension, aTotalDimension, aSubsDimension, aSubsNumber);
      logger.log('setPreferedResolution -', chosenAlgorithm, ':', aSubscriber.stream.streamId,
                 'of', aSubsNumber, ': Existing:', streamDimension, 'Requesting:', newDimension);
      aSubscriber.setPreferredResolution(newDimension);
    }

    return {
      get session() {
        return _session;
      },
      connect: connect,
      off: off,
      publish: publish,
      subscribe: subscribe,
      toggleSubscribersAudio: toggleSubscribersAudio,
      toggleSubscribersVideo: toggleSubscribersVideo,
      togglePublisherAudio: togglePublisherAudio,
      togglePublisherVideo: togglePublisherVideo,
      shareScreen: shareScreen,
      stopShareScreen: stopShareScreen,
      get isPublisherReady() {
        return _publisherInitialized;
      },
      disconnect: disconnect,
      removeListener: removeListener,
      publisherHas: function(aType) {
        return _publisher.stream['has' + (aType.toLowerCase() === 'audio' && 'Audio' || 'Video')];
      },
      get publisherId() {
        return (_publisherInitialized && _publisher && _publisher.stream && _publisher.stream.id) ||
          null;
      },
      isMyself: function(connection) {
        return _session &&
          _session.connection.connectionId === connection.connectionId;
      },
      get screenShare() {
        return _screenShare;
      },
      getImg: function(stream) {
        if (!stream) {
          return null;
        }

        if (typeof stream.getImgData === 'function') {
          return stream.getImgData();
        }

        var subscribers = _session.getSubscribersForStream(stream);
        return subscribers.length ? subscribers[0].getImgData() : null;
      },
      showAnnotationToolbar: function(aShow) {
        var container = document.getElementById('annotationToolbarContainer');
        if (!container) {
          return;
        }
        (aShow && (container.classList.remove('ots-hidden') || true)) ||
          container.classList.add('ots-hidden');
      },
      setPreferredResolution: setPreferredResolution
    };
  }

  OTHelper.registerScreenShareExtension = registerScreenShareExtension;
  OTHelper.screenShareErrorCodes = PUB_SCREEN_ERROR_CODES;

  global.OTHelper = OTHelper;

}(this);
