!(global => {
  let otPromise = Promise.resolve();
  let annotation;

  otPromise = LazyLoader.load([opentokJsUrl]);

  const MSG_MULTIPART = 'signal';
  const SIZE_MAX = 7800;

  const HEAD_SIZE =
        JSON.stringify({ _head: { id: 99, seq: 99, tot: 99}, data: "" }).length;
  const USER_DATA_SIZE = SIZE_MAX - HEAD_SIZE;
  const logger =
        new Utils.MultiLevelLogger('OTHelper.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  const requestedResolutions = {};
  const otLoaded = otPromise.then(() => {
    const hasRequirements = OT.checkSystemRequirements();
    if (!hasRequirements) {
      OT.upgradeSystemRequirements();
      throw new Error('Unsupported browser, probably needs upgrade');
    }
    return;
  });

  // Done intentionally (to use string codes for our error codes)
  // so as to not overwrite existing OT library codes
  const PUB_SCREEN_ERROR_CODES = {
    accessDenied: 1500,
    extNotInstalled: 'OT0001',
    extNotRegistered: 'OT0002',
    notSupported: 'OT0003',
    errPublishingScreen: 'OT0004'
  };

  function getScreenShareCapability() {
    return new Promise((resolve, reject) => {
      OT.checkScreenSharingCapability(response => {
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
    Object.keys(aParams).forEach(aKey => {
      OT.registerScreenSharingExtension(aKey, aParams[aKey], version || 2);
    });
  }

  const sendSignal = (() => {
    let messageOrder = 0;
    function composeSegment(aMsgId, aSegmentOrder, aTotalSegments, aUsrMsg) {
      const obj = {
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
    const sendSignal = function(aType, aMsgData, aTo) {
      const session = this;
      return new Promise((resolve, reject) => {
        const msg = {
          type: aType,
          data: aMsgData && JSON.stringify(aMsgData)
        };
        const msgId = ++messageOrder;
        const totalSegments = msg.data ? Math.ceil(msg.data.length / USER_DATA_SIZE) : 1;
        const messagesSent = [];
        for (let segmentOrder = 0; segmentOrder < totalSegments; segmentOrder++) {
          const signalData = composeSegment(msgId, segmentOrder, totalSegments, msg);
          if (aTo) {
            signalData.to = aTo;
          }
          messagesSent[segmentOrder] =
            new Promise((resolveMessage, rejectMessage) => {
              session.signal(signalData, error => {
                (error && (rejectMessage(error) || true)) || resolveMessage();
              });
            });
        }
        Promise.all(messagesSent).then(resolve).catch(reject);
      });
    };
    return sendSignal;
  })();

  const receiveMultipartMsg = (() => {
    const _msgPieces = {};

    //
    // Multipart message reception proccess
    //
    function parseMultiPartMsg(aEvt) {
      let dataParsed;
      dataParsed = JSON.parse(aEvt.data);
      const fromConnectionId = aEvt.from !== null ? aEvt.from.connectionId : 'server';
      return {
        connectionId: fromConnectionId,
        head: dataParsed._head,
        data: dataParsed.data
      };
    }

    const receiveMultipartMsg = (aFcClients, aEvt) => {
      const parsedMsg = parseMultiPartMsg(aEvt);

      let connection = _msgPieces[parsedMsg.connectionId];
      let newPromise = null;
      // First msg from a client
      if (!connection) {
        connection = {};
        _msgPieces[parsedMsg.connectionId] = connection;
      }

      let msg = connection[parsedMsg.head.id];

      // First piece of a message
      if (!msg) {
        msg = {
          have: 0,
          data: new Array(parsedMsg.head.tot),
          promiseSolver: null
        };
        // Get a new solver
        newPromise = new Promise((resolve, reject) => {
          msg.promiseSolver = resolve;
        });
        aFcClients.forEach(aFc => {
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

      if (parsedMsg.connectionId === 'server') {
        msg.promiseSolver(parsedMsg.data);
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
    const _interceptedHandlers = {};

    // First add the handlers removing the ones we want to intercept...
    for(let i = 0; i < aHandlers.length; i++) {
      const _handlers = {};
      Object.
        keys(aHandlers[i]).
        forEach(evtName => {
          const handler = aHandlers[i][evtName];
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
      forEach(evtName => {
        _interceptedHandlers[evtName] =
          receiveMultipartMsg.bind(undefined, _interceptedHandlers[evtName]);
      });
    aReceiver.on(_interceptedHandlers);
  }

  // aSessionInfo must have sessionId, applicationId, token
  function OTHelper() {
    let _session;
    let _publisher;
    let _publisherInitialized = false;

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
    function connect(sessionInfo, aHandlers) {
      const self = this;
      const applicationId = sessionInfo.applicationId;
      const sessionId = sessionInfo.sessionId;
      const token = sessionInfo.token;
      if (!Array.isArray(aHandlers)) {
        aHandlers = [aHandlers];
      }
      return otLoaded.then(() => {
        return new Promise((resolve, reject) => {
          if (!(applicationId && sessionId && token)) {
            return reject({
              message: 'Invalid parameters received. ' +
                'applicationId, sessionId and token are mandatory'
            });
          }
          disconnect();
          _session = OT.initSession(applicationId, sessionId);
          _session.off();

          aHandlers && _setHandlers(self, self.session, aHandlers);

          return _session.connect(token, error => {
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

    let _publishOptions;
    // We will use this in case the first publish fails. On the error we will give the caller a
    // promise that will fulfill when/if the publish succeeds at some future time (because of a
    // retry).
    let _solvePublisherPromise;
    const _publisherPromise = new Promise((resolve, reject) => {
      _solvePublisherPromise = resolve;
    });

    function initPublisher(aDOMElement, aProperties, aHandlers) {
      return new Promise((resolve, reject) => {
        otLoaded.then(() => {
          getFilteredSources({
            audioSource: aProperties.audioSource,
            videoSource: aProperties.videoSource
          }).then(mediaSources => {
            Object.assign(aProperties, mediaSources);
            _publisher = OT.initPublisher(aDOMElement, aProperties);
            return resolve(_publisher);
          });
          
        });
      });
    }

    function publish(aDOMElement, aProperties, aHandlers) {
      const self = this;
      _publishOptions = null;
      const propCopy = {};
      Object.keys(aProperties).forEach(aKey => {
        propCopy[aKey] = aProperties[aKey];
      });
      return new Promise((resolve, reject) => {
        function processError(error) {
          _publishOptions = {
            elem: aDOMElement,
            properties: propCopy,
            handlers: aHandlers
          };
          _publisher = null;
          reject({ error, publisherPromise: _publisherPromise });
        }

        _publisher = OT.initPublisher(aDOMElement, aProperties, error => {
          if (error) {
            processError({
              name: error.name,
              message: `Error initializing publisher. ${error.message}`
            });
           return;
          }
          _session.publish(_publisher, error => {
            if (error) {
              processError(error);
            } else {
              _publisherInitialized = true;
              Object.keys(aHandlers).forEach(name => {
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
      const arrSubscribers = _session.getSubscribersForStream(aStream);
      // TODO Currently we expect only one element in arrSubscriber
      Array.isArray(arrSubscribers) && arrSubscribers.forEach(subscriber => {
        subscriber[`subscribeTo${name}`](value);
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
      publisherReady().then(aPublisher => {
        aPublisher[`publish${aProperty}`](aValue);
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

    function toggleFacingMode() {
      return _publisher.cycleVideo();
    }

    function setAudioSource(deviceId) {
      _publisher.setAudioSource(deviceId)
    }

    let _screenShare;

    const FAKE_OTK_ANALYTICS = global.OTKAnalytics ||
      (() => { return {
          addSessionInfo() {},
          logEvent(a, b) {
            console.log(a,b);
          }
          };
      });

    // TO-DO: Make this configurable
    const IMAGE_ASSETS = '/images/annotations/';
    const TOOLBAR_BG_COLOR = '#1a99ce';

    function getAnnotation(aDomElement, aOptions) {
      aOptions = aOptions || {};
      const options = {
        session: aOptions.session || _session,
        watchForResize: aOptions.watchForResize || window,
        canvasContainer: aDomElement,
        OTKAnalytics: aOptions.OTKAnalytics || FAKE_OTK_ANALYTICS,
        imageAssets: IMAGE_ASSETS
      };
      return new AnnotationAccPack(options);
    }
    function resizeAnnotationCanvas () {
      annotation && annotation.resizeCanvas();
    }

    function startAnnotation(aAccPack) {
      if (!aAccPack) {
        return Promise.resolve();
      }
      annotation = aAccPack;
      Utils.addEventsHandlers('roomView:', {
        screenChange: resizeAnnotationCanvas
      });
      return aAccPack.start(_session, {
        imageAssets: IMAGE_ASSETS,
        backgroundColor: TOOLBAR_BG_COLOR
      });
    }

    // aElement can be a publisher, a subscriber or a AnnotationPack
    function endAnnotation(aElement) {
      const annPack =  aElement && aElement._ANNOTATION_PACK || aElement;
      annPack && annPack.end && annPack.end();
      Utils.removeEventHandlers('roomView:', {
        screenChange: resizeAnnotationCanvas
      });
      annotation = null;
    }

    function setupAnnotation(aAccPack, aPubSub, aParentElement) {
      if (!aAccPack) {
        return;
      }
      const container = document.getElementById(aPubSub.id);
      const canvasOptions = {
        absoluteParent: aParentElement
      };
      aAccPack.linkCanvas(aPubSub, container, canvasOptions);
      aPubSub._ANNOTATION_PACK = aAccPack;
    }

    function getDevices(kind = 'all') {
      return new Promise((resolve, reject) => {
        OT.getDevices((error, devices) => {
          if (error) return reject(error);
          devices = devices.filter(device => { return device.kind === kind || kind === 'all' });
          return resolve(devices);
        });
      });  
    }

    function getVideoDeviceNotInUse(selectedDeviceId) {
      return new Promise((resolve, reject) => {
        getDevices('videoInput').then(videoDevices => {
          const matchingDevice = videoDevices.find(device => {
            return device.deviceId !== selectedDeviceId;
          });

          return resolve(matchingDevice || selectedDeviceId);
        });
      });
    }

    function getFallbackMediaDeviceId(devices, kind) {
      kind = kind.replace('Source', 'Input');
      const matchingDevice = devices.find(device => {
        return device.kind === kind;
      });  
      return matchingDevice ? matchingDevice.deviceId : null;
    }

    function getFilteredSources(mediaDeviceIds) {
      return new Promise((resolve, reject) => {
        getDevices().then(devices => {          
          for (const source in mediaDeviceIds) {
            const matchingDevice = devices.find(device => {
              return device.deviceId === mediaDeviceIds[source];
            });

            if (!matchingDevice) mediaDeviceIds[source] = getFallbackMediaDeviceId(devices, source);
          }
          return resolve(mediaDeviceIds);
      }).catch(e => {
        return reject(e);
      });
    });
   }  

    function subscribe(aStream, aTargetElement, aProperties, aHandlers, aEnableAnnotation) {
      const self = this;
      return new Promise((resolve, reject) => {
        const subscriber =
          _session.subscribe(aStream, aTargetElement, aProperties, error => {
            error ? reject(error) : resolve(subscriber);
          });
      }).then(subscriber => {
        Object.keys(aHandlers).forEach(name => {
          subscriber.on(name, aHandlers[name].bind(self));
        });
        subscriber.on('destroyed', evt => {
          subscriber.off();
          endAnnotation(subscriber);
        });
        const subsAnnotation =
          (aEnableAnnotation && aStream.videoType === 'screen' && getAnnotation(aTargetElement)) ||
          null;
        return startAnnotation(subsAnnotation).then(() => {
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
      const self = this;
      const screenShareCapability = getScreenShareCapability();
      if (!Array.isArray(aHandlers)) {
        aHandlers = [aHandlers];
      }

      return screenShareCapability.then(() => {
        return new Promise((resolve, reject) => {
          const annotationAccPack = aEnableAnnotation && getAnnotation(aDOMElement);
          startAnnotation(annotationAccPack).
            then(() => {
              _screenShare = OT.initPublisher(aDOMElement, aProperties, error => {
                if (error) {
                  endAnnotation(annotationAccPack);
                  reject(error);
                } else {
                  _session.publish(_screenShare, error => {
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
      const PrefResolutionAlgProv = global.PreferredResolutionAlgorithmProvider;
      if (!PrefResolutionAlgProv) {
        return;
      }
      const algInfo = PrefResolutionAlgProv.getAlg(aAlgorithm);
      const chosenAlgorithm = algInfo.chosenAlgorithm;
      const algorithm = algInfo.algorithm;
      const streamDimension = aSubscriber.stream.videoDimensions;
      const newDimension =
        algorithm(streamDimension, aTotalDimension, aSubsDimension, aSubsNumber);

      if (!requestedResolutions[aSubscriber.id]) {
        // Set the initial subscriber stream resolution
        requestedResolutions[aSubscriber.id] = aSubscriber.stream.videoDimensions;
      }

      const existingResolution = requestedResolutions[aSubscriber.id];
      if (newDimension.width === existingResolution.width && newDimension.height === existingResolution.height ) {
        return; // No need to request a new resolution
      }

      logger.log('setPreferedResolution -', chosenAlgorithm, ':', aSubscriber.stream.streamId,
                 'of', aSubsNumber, ': Existing:', existingResolution, 'Requesting:', newDimension);

      requestedResolutions[aSubscriber.id] = newDimension;
      aSubscriber.setPreferredResolution(newDimension);
    }

    return {
      get session() {
        return _session;
      },
      connect,
      getDevices,
      getVideoDeviceNotInUse,
      initPublisher,
      off,
      otLoaded,
      publish,
      toggleSubscribersAudio,
      toggleSubscribersVideo,
      togglePublisherAudio,
      togglePublisherVideo,
      toggleFacingMode,
      setAudioSource,
      shareScreen,
      subscribe,
      stopShareScreen,
      get isPublisherReady() {
        return _publisherInitialized;
      },
      disconnect,
      removeListener,
      publisherHas(aType) {
        return _publisher.stream[`has${aType.toLowerCase() === 'audio' && 'Audio' || 'Video'}`];
      },
      get publisherId() {
        return (_publisherInitialized && _publisher && _publisher.stream && _publisher.stream.id) ||
          null;
      },
      isMyself(connection) {
        return _session &&
          _session.connection.connectionId === connection.connectionId;
      },
      get screenShare() {
        return _screenShare;
      },
      getImg(stream) {
        if (!stream) {
          return null;
        }

        if (typeof stream.getImgData === 'function') {
          return stream.getImgData();
        }

        const subscribers = _session.getSubscribersForStream(stream);
        return subscribers.length ? subscribers[0].getImgData() : null;
      },
      showAnnotationToolbar(aShow) {
        const container = document.getElementById('annotationToolbarContainer');
        if (!container) {
          return;
        }
        (aShow && (container.classList.remove('ots-hidden') || true)) ||
          container.classList.add('ots-hidden');
      },
      setPreferredResolution
    };
  }

  OTHelper.registerScreenShareExtension = registerScreenShareExtension;
  OTHelper.screenShareErrorCodes = PUB_SCREEN_ERROR_CODES;

  global.OTHelper = OTHelper;
})(this);
    