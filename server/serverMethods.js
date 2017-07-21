// This file implements the API described in api.yml

// Note: Since we're not putting the TB key and data here, and don't really want
// to have a not-checked-in file for that either, we're just going to store them
// on redis (and they should be already stored when this runs).
// Just run:
// redis-cli set tb_api_key yourkeyhere
// redis-cli set tb_api_secret yoursecrethere
// Once before trying to run this.
// The second argument is only really needed for the unit tests.

'use strict';

var SwaggerBP = require('swagger-boilerplate');
var C = require('./serverConstants');
var configLoader = require('./configLoader');
var FirebaseArchives = require('./firebaseArchives');


function ServerMethods(aLogLevel, aModules) {
  aModules = aModules || {};

  var ErrorInfo = SwaggerBP.ErrorInfo;

  var env = process.env;
  var Utils = SwaggerBP.Utils;

  var Logger = Utils.MultiLevelLogger;
  var promisify = Utils.promisify;

  var Opentok = aModules.Opentok || require('opentok');  // eslint-disable-line global-require

  if (aModules.Firebase) {
    FirebaseArchives.Firebase = aModules.Firebase;
  }


  var logger = new Logger('ServerMethods', aLogLevel);
  var ServerPersistence = SwaggerBP.ServerPersistence;
  var connectionString =
    (aModules && aModules.params && aModules.params.persistenceConfig) ||
    env.REDIS_URL || env.REDISTOGO_URL || '';
  var serverPersistence =
    new ServerPersistence([], connectionString, aLogLevel, aModules);

  const redisRoomPrefix = C.REDIS_ROOM_PREFIX;

  // Opentok API instance, which will be configured only after tbConfigPromise
  // is resolved
  var tbConfigPromise;

  // Initiates polling from the Opentok servers for changes on the status of an archive.
  // This is a *very* specific polling since we expect the archive will have already been stopped
  // by the time this launches and we're just waiting for it to be available or uploaded.
  // To try to balance not polling to often with trying to get a result fast, the polling time
  // increases exponentially (on the theory that if the archive is small it'll be copied fast
  // and if it's big we don't want to look too impatient).
  function _launchArchivePolling(aOtInstance, aArchiveId, aTimeout, aTimeoutMultiplier) {
    return new Promise((resolve) => {
      var timeout = aTimeout;
      var pollArchive = function _pollArchive() {
        logger.log('Poll [', aArchiveId, ']: polling...');
        aOtInstance.getArchive_P(aArchiveId).then((aArchive) => {
          if (aArchive.status === 'available' || aArchive.status === 'uploaded') {
            logger.log('Poll [', aArchiveId, ']: Resolving with', aArchive.status);
            resolve(aArchive);
          } else {
            timeout *= aTimeoutMultiplier;
            logger.log('Poll [', aArchiveId, ']: Retrying in', timeout);
            setTimeout(_pollArchive, timeout);
          }
        });
      };
      logger.log('Poll [', aArchiveId, ']: Setting first try for', timeout);
      setTimeout(pollArchive, timeout);
    });
  }

  function _shutdownOldInstance(aOldPromise, aNewPromise) {
    aOldPromise && (aNewPromise !== aOldPromise) &&
      aOldPromise.then(aObject => aObject.shutdown());
  }


  function _initialTBConfig() {
    return configLoader.readConfigJson().then((config) => {
              // This will hold the configuration read from Redis
      var defaultTemplate = config.get(C.DEFAULT_TEMPLATE);
      var templatingSecret = config.get(C.TEMPLATING_SECRET);
      var apiKey = config.get(C.OPENTOK_API_KEY);
      var apiSecret = config.get(C.OPENTOK_API_SECRET);
      var archivePollingTO = config.get(C.ARCHIVE_POLLING_INITIAL_TIMEOUT);
      var archivePollingTOMultiplier =
                config.get(C.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER);
      var otInstance = Utils.CachifiedObject(Opentok, apiKey, apiSecret);

      var allowIframing = config.get(C.ALLOW_IFRAMING);
      var archiveAlways = config.get(C.ARCHIVE_ALWAYS);

      var iosAppId = config.get(C.IOS_APP_ID);
      var iosUrlPrefix = config.get(C.IOS_URL_PREFIX);

      // This isn't strictly necessary... but since we're using promises all over the place, it
      // makes sense. The _P are just a promisified version of the methods. We could have
      // overwritten the original methods but this way we make it explicit. That's also why we're
      // breaking camelCase here, to make it patent to the reader that those aren't standard
      // methods of the API.
      ['startArchive', 'stopArchive', 'getArchive', 'listArchives', 'deleteArchive']
              .forEach(method => otInstance[method + '_P'] = promisify(otInstance[method])); // eslint-disable-line no-return-assign

      var maxSessionAge = config.get(C.OPENTOK_MAX_SESSION_AGE);
      var maxSessionAgeMs = maxSessionAge * 24 * 60 * 60 * 1000;
      var chromeExtId = config.get(C.CHROME_EXTENSION_ID);

      var isWebRTCVersion = config.get(C.DEFAULT_INDEX_PAGE) === 'opentokrtc';

      var firebaseConfigured =
              config.get(C.FIREBASE_DATA_URL) && config.get(C.FIREBASE_AUTH_SECRET);

      var enableArchiving = config.get(C.ENABLE_ARCHIVING, config);
      var enableArchiveManager = enableArchiving && config.get(C.ENABLE_ARCHIVE_MANAGER);
      var enableScreensharing = config.get(C.ENABLE_SCREENSHARING);
      var enableAnnotations = enableScreensharing && config.get(C.ENABLE_ANNOTATIONS);
      var enableFeedback = config.get(C.ENABLE_FEEDBACK);

      if (!firebaseConfigured && enableArchiveManager) {
        logger.error('Firebase not configured. Please provide firebase credentials or disable archive_manager');
      }


            // For this object we need to know if/when we're reconnecting so we can shutdown the
            // old instance.
      var oldFirebaseArchivesPromise = Utils.CachifiedObject.getCached(FirebaseArchives);

      var firebaseArchivesPromise =
              Utils.CachifiedObject(FirebaseArchives, config.get(C.FIREBASE_DATA_URL),
                                    config.get(C.FIREBASE_AUTH_SECRET),
                                    config.get(C.EMPTY_ROOM_LIFETIME), aLogLevel);
      _shutdownOldInstance(oldFirebaseArchivesPromise, firebaseArchivesPromise);

      return firebaseArchivesPromise
              .then(firebaseArchives => ({
                otInstance,
                apiKey,
                apiSecret,
                archivePollingTO,
                archivePollingTOMultiplier,
                maxSessionAgeMs,
                fbArchives: firebaseArchives,
                allowIframing,
                chromeExtId,
                defaultTemplate,
                templatingSecret,
                archiveAlways,
                iosAppId,
                iosUrlPrefix,
                isWebRTCVersion,
                enableArchiving,
                enableArchiveManager,
                enableScreensharing,
                enableAnnotations,
                enableFeedback,
              }));
    });
  }

  function configReady(aReq, aRes, aNext) {
    tbConfigPromise.then((tbConfig) => {
      aReq.tbConfig = tbConfig;
      aNext();
    });
  }


  function iframingOptions(aReq, aRes, aNext) {
    // By default, and the fallback also in case of misconfiguration is 'never'
    switch (aReq.tbConfig.allowIframing) {
      case 'always': // Nothing to do
        break;
      case 'sameorigin':
        aRes.set('X-Frame-Options', 'SAMEORIGIN');
        break;
      default:
        aRes.set('X-Frame-Options', 'DENY');
    }
    aNext();
  }

  function featureEnabled(aReq, aRes, aNext) {
    var disabledFeatures = aReq.tbConfig.disabledFeatures;
    if (!disabledFeatures) {
      aNext();
      return;
    }
    var path = aReq.path;
    if (disabledFeatures.filter(feature => path.search('\\/' + feature + '(\\/|$)') !== -1).length > 0) {
      logger.log('featureEnabled: Refusing to serve disabled feature: ' + path);
      aRes.status(400).send(new ErrorInfo(400, 'Unauthorized access'));
    } else {
      aNext();
    }
  }

  function getRoomArchive(aReq, aRes) {
    logger.log('getRoomArchive ' + aReq.path, 'roomName: ' + aReq.params.roomName);
    var tbConfig = aReq.tbConfig;
    var roomName = aReq.params.roomName.toLowerCase();
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.otInstance,
                                      tbConfig.maxSessionAgeMs,
                                      tbConfig.archiveAlways))
      .then((usableSessionInfo) => {
        serverPersistence.setKeyEx(tbConfig.maxSessionAgeMs, redisRoomPrefix + roomName,
                                   JSON.stringify(usableSessionInfo));
        var sessionId = usableSessionInfo.sessionId;
        tbConfig.otInstance.listArchives_P({ offset: 0, count: 1000 })
          .then((aArchives) => {
            var archive = aArchives.reduce((aLastArch, aCurrArch) =>
              aCurrArch.sessionId === sessionId &&
              aCurrArch.createdAt > aLastArch.createdAt &&
              (aCurrArch || aLastArch), { createdAt: 0 });

            if (!archive.sessionId || !archive.url) {
              aRes.status(404).send(new ErrorInfo(404, 'Unknown archive'));
            } else {
              aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
              aRes.set('Pragma', 'no-cache');
              aRes.set('Expires', 0);

              aRes.render('archivePreview.ejs', {
                archiveName: archive.name,
                archiveURL: archive.url,
              });
            }
          })
          .catch((error) => {
            logger.log('getRoomArchive. Error:', error);
            aRes.status(400).send(error);
          });
      }).catch((error) => {
        logger.log('getRoomArchive. Error:', error);
        aRes.status(400).send(error);
      });
  }

  // Update archive callback. TO-DO: Is there any way of restricting calls to this?
  function postUpdateArchiveInfo(aReq, aRes) {
    var archive = aReq.body;
    var tbConfig = aReq.tbConfig;
    var fbArchives = tbConfig.fbArchives;
    if (!archive.sessionId || !archive.id) {
      logger.log('postUpdateArchiveInfo: Got an invalid call! Ignoring.', archive);
    } else if (archive.status === 'available' || archive.status === 'updated') {
      logger.log('postUpdateArchiveInfo: Updating information for archive:', archive.id);
      fbArchives.updateArchive(archive.sessionId, archive);
    } else {
      logger.log('postUpdateArchiveInfo: Ignoring updated status for', archive.id, ':',
                 archive.status);
    }
    aRes.send({});
  }

  // Returns the personalized root page
  function getRoot(aReq, aRes) {
    aRes
      .render('index.ejs', {
        isWebRTCVersion: aReq.tbConfig.isWebRTCVersion,
      }, (err, html) => {
        if (err) {
          logger.error('getRoot. error: ', err);
          aRes.status(500).send(new ErrorInfo(500, 'Invalid Template'));
        } else {
          aRes.send(html);
        }
      });
  }

  // Return the personalized HTML for a room.
  function getRoom(aReq, aRes) {
    var query = aReq.query;
    logger.log('getRoom serving ' + aReq.path, 'roomName:', aReq.params.roomName,
               'userName:', query && query.userName,
               'template:', query && query.template);
    var tbConfig = aReq.tbConfig;
    var template = query && tbConfig.templatingSecret &&
      (tbConfig.templatingSecret === query.template_auth) && query.template;
    var userName = query && query.userName;

    // We really don't want to cache this
    aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    aRes.set('Pragma', 'no-cache');
    aRes.set('Expires', 0);
    aRes
      .render((template || tbConfig.defaultTemplate) + '.ejs',
      {
        isWebRTCVersion: tbConfig.isWebRTCVersion,
        userName: userName || C.DEFAULT_USER_NAME,
        roomName: aReq.params.roomName,
        chromeExtensionId: tbConfig.chromeExtId,
        iosAppId: tbConfig.iosAppId,
               // iosUrlPrefix should have something like:
               // https://opentokdemo.tokbox.com/room/
               // or whatever other thing that should be before the roomName
        iosURL: tbConfig.iosUrlPrefix + aReq.params.roomName + '?userName=' +
                       (userName || C.DEFAULT_USER_NAME),
        enableArchiving: tbConfig.enableArchiving,
        enableArchiveManager: tbConfig.enableArchiveManager,
        enableScreensharing: tbConfig.enableScreensharing,
        enableAnnotation: tbConfig.enableAnnotation,
        enableFeedback: tbConfig.enableFeedback,
      }, (err, html) => {
        if (err) {
          logger.log('getRoom. error:', err);
          aRes.status(400).send(new ErrorInfo(400, 'Unknown template.'));
        } else {
          aRes.send(html);
        }
      });
  }

  // Given a sessionInfo (which might be empty or non usable) returns a promise than will fullfill
  // to an usable sessionInfo. This function cannot be invoked directly, it has
  // to be bound so 'this' is a valid Opentok instance!
  function _getUsableSessionInfo(aMaxSessionAge, aArchiveAlways, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve) => {
      var minLastUsage = Date.now() - aMaxSessionAge;

      logger.log('getUsableSessionInfo. aSessionInfo:', JSON.stringify(aSessionInfo),
                 'minLastUsage: ', minLastUsage, 'maxSessionAge:', aMaxSessionAge,
                 'archiveAlways: ', aArchiveAlways);

      if (!aSessionInfo || aSessionInfo.lastUsage <= minLastUsage) {
        // We need to create a new session...
        var sessionOptions = { mediaMode: 'routed' };
        if (aArchiveAlways) {
          sessionOptions.archiveMode = 'always';
        }
        this
          .createSession(sessionOptions, (error, session) => {
            resolve({
              sessionId: session.sessionId,
              lastUsage: Date.now(),
              inProgressArchiveId: undefined,
            });
          });
      } else {
        // We only need to update the last usage data...
        resolve({
          sessionId: aSessionInfo.sessionId,
          lastUsage: Date.now(),
          inProgressArchiveId: aSessionInfo.inProgressArchiveId,
        });
      }
    });
  }

  // Get the information needed to connect to a session
  // (creates it also if it isn't created already).
  // Returns:
  // RoomInfo {
  //   sessionId: string
  //   apiKey: string
  //   token: string
  //   username: string
  //   firebaseURL: string
  //   firebaseToken: string
  //   chromeExtId: string value || 'undefined'
  // }
  var _numAnonymousUsers = 1;
  function getRoomInfo(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var fbArchives = tbConfig.fbArchives;
    var roomName = aReq.params.roomName.toLowerCase();
    var userName =
      (aReq.query && aReq.query.userName) || C.DEFAULT_USER_NAME + _numAnonymousUsers++;
    logger.log('getRoomInfo serving ' + aReq.path, 'roomName: ', roomName, 'userName: ', userName);

    var enableArchiveManager = tbConfig.enableArchiveManager;
    // We have to check if we have a session id stored already on the persistence provider (and if
    // it's not too old).
    // Note that we do not persist tokens.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.otInstance, tbConfig.maxSessionAgeMs,
                                      tbConfig.archiveAlways))
      .then((usableSessionInfo) => {
        // Update the database. We could do this on getUsable...
        serverPersistence.setKeyEx(tbConfig.maxSessionAgeMs, redisRoomPrefix + roomName,
                                   JSON.stringify(usableSessionInfo));

        // We have to create an authentication token for the new user...
        var fbUserToken =
          enableArchiveManager && fbArchives.createUserToken(usableSessionInfo.sessionId, userName);
        // and finally, answer...
        var answer = {
          apiKey: tbConfig.apiKey,
          token: tbConfig.otInstance
                  .generateToken(usableSessionInfo.sessionId, {
                    role: 'publisher',
                    data: JSON.stringify({ userName }),
                  }),
          username: userName,
          firebaseURL:
            (enableArchiveManager && fbArchives.baseURL + '/' + usableSessionInfo.sessionId) || 'unknown',
          firebaseToken: fbUserToken || 'unknown',
          chromeExtId: tbConfig.chromeExtId,
          enableArchiveManager: tbConfig.enableArchiveManager,
          enableAnnotation: tbConfig.enableAnnotations,
          enableArchiving: tbConfig.enableArchiving,
        };
        answer[aReq.sessionIdField || 'sessionId'] = usableSessionInfo.sessionId;
        aRes.send(answer);
      });
  }

  function _getUpdatedArchiveInfo(aTbConfig, aOperation, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    if (!aSessionInfo) {
      throw new ErrorInfo(104, 'Invalid (non existant) room');
    }

    logger.log('_getUpdatedArchiveInfo: ', aSessionInfo);
    var minLastUsage = Date.now() - aTbConfig.maxSessionAgeMs;
    // What do we do if we get an order for an expired session? Since if it's expired then
    // nobody should be on and as such there will not be any streams... if it's expired we just
    // return an error
    if (aSessionInfo.lastUsage <= minLastUsage) {
      throw new ErrorInfo(101, 'Invalid (expired) room');
    }

    if (aOperation.startsWith('start') && aSessionInfo.inProgressArchiveId) {
      // Hmm.. this might be an error or that somehow we lost the stop event... doesn't hurt to
      // be sure
      logger.log('_getUpdatedArchiveInfo: Getting update info for archive: ',
                 aSessionInfo.inProgressArchiveId);
      return aTbConfig.otInstance
        .getArchive_P(aSessionInfo.inProgressArchiveId)
        .then((aArchiveInfo) => {
          if (aArchiveInfo.status === 'started') {
            throw new ErrorInfo(102, 'Recording already in progress');
          } else {
            aSessionInfo.inProgressArchiveId = undefined;
          }
          return aSessionInfo;
        }).catch((e) => {
          if (e.code === 102) {
            throw e;
          }
          // This should mean that the archive doesn't exist. Just go with the flow...
          aSessionInfo.inProgressArchiveId = undefined;
          return aSessionInfo;
        });
    } else if (aOperation.startsWith('stop') && !aSessionInfo.inProgressArchiveId) {
      return aTbConfig.otInstance.listArchives_P({ offset: 0, count: 100 })
        .then(aArch => aArch.filter(aArchive => aArchive.sessionId === aSessionInfo.sessionId))
        .then((aArchives) => {
          var recordingInProgress = aArchives[0] && aArchives[0].status === 'started';
          if (recordingInProgress) {
            aSessionInfo.inProgressArchiveId = aArchives[0].id;
          } else {
            throw new ErrorInfo(105, 'Cannot stop a non existant recording');
          }
          return aSessionInfo;
        });
    }
      // We might still need to update the archive information but for now consider it's valid.
    return aSessionInfo;
  }

  // /room/:roomName/archive?userName=username&operation=startComposite|startIndividual|stop
  // Returns ArchiveInfo:
  // { archiveId: string, archiveType: string }
  function postRoomArchive(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var body = aReq.body;
    if (!body || !body.userName || !body.operation) {
      logger.log('postRoomArchive => missing body parameter: ', aReq.body);
      aRes.status(400).send(new ErrorInfo(100, 'Missing required parameter'));
      return;
    }
    var roomName = aReq.params.roomName.toLowerCase();
    var userName = body.userName;
    var operation = body.operation;
    var otInstance = tbConfig.otInstance;

    logger.log('postRoomArchive serving ' + aReq.path, 'roomName:', roomName,
               'userName:', userName);
    // We could also keep track of the current archive ID on the client app. But the proposed
    // API makes it simpler for the client app, since it only needs the room name to stop an
    // in-progress recording. So we can just get the sessionInfo from the serverPersistence.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUpdatedArchiveInfo.bind(undefined, tbConfig, operation))
      .then((sessionInfo) => {
        var now = new Date();
        var archiveOptions = {
          name: userName + ' ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
        };
        var archiveOp;
        switch (operation) {
          case 'startIndividual':
            archiveOptions.outputMode = 'individual';
            // falls through
          case 'startComposite':
            logger.log('Binding archiveOp to startArchive with sessionId:', sessionInfo.sessionId);
            archiveOp =
              otInstance.startArchive_P.bind(otInstance, sessionInfo.sessionId, archiveOptions);
            break;
          case 'stop':
            archiveOp = otInstance.stopArchive_P.bind(otInstance, sessionInfo.inProgressArchiveId);
            break;
        }
        logger.log('postRoomArchive: Invoking archiveOp. SessionInfo', sessionInfo);
        return archiveOp().then((aArchive) => {
          sessionInfo.inProgressArchiveId = aArchive.status === 'started' ? aArchive.id : undefined;
          // Update the internal database
          serverPersistence.setKey(redisRoomPrefix + roomName, JSON.stringify(sessionInfo));

          // We need to update the external database also. We have a conundrum here, though.
          // At this point, if the operation requested was stopping an active recording, the
          // archive information will not be updated yet. We can wait to be notified (by a callback)
          // or poll for the information. Since polling is less efficient, we do so only when
          // required by the configuration.
          var readyToUpdateExternalDb =
            (operation === 'stop' && tbConfig.archivePollingTO &&
             _launchArchivePolling(otInstance, aArchive.id,
                                   tbConfig.archivePollingTO,
                                   tbConfig.archivePollingTOMultiplier)) ||
            Promise.resolve(aArchive);

          readyToUpdateExternalDb
            .then((aUpdatedArchive) => {
              aUpdatedArchive.localDownloadURL = '/archive/' + aArchive.id;
              operation !== 'stop' && (aUpdatedArchive.recordingUser = userName);
              tbConfig.fbArchives.updateArchive(sessionInfo.sessionId, aUpdatedArchive);
            });

          logger.log('postRoomArchive => Returning archive info: ', aArchive.id);
          aRes.send({
            archiveId: aArchive.id,
            archiveType: aArchive.outputMode,
          });
        });
      })
      .catch((error) => {
        logger.log('postRoomArchive. Sending error:', error);
        aRes.status(400).send(error);
      });
  }

  function getArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    var generatePreview = (aReq.query && aReq.query.generatePreview !== undefined);
    logger.log('getAchive:', archiveId, generatePreview);

    aReq.tbConfig.otInstance
      .getArchive_P(archiveId)
      .then((aArchive) => {
        if (!generatePreview) {
          aRes.redirect(301, aArchive.url);
          return;
        }

        aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        aRes.set('Pragma', 'no-cache');
        aRes.set('Expires', 0);

        aRes.render('archivePreview.ejs', {
          archiveName: aArchive.name,
          archiveURL: aArchive.url,
        });
      }).catch((e) => {
        logger.error('getArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function deleteArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    logger.log('deleteArchive:', archiveId);
    var tbConfig = aReq.tbConfig;
    var otInstance = tbConfig.otInstance;
    var sessionId;
    var type;
    otInstance
      .getArchive_P(archiveId) // This is only needed so we can get the sesionId
      .then((aArchive) => {
        sessionId = aArchive.sessionId;
        type = aArchive.outputMode;
        return archiveId;
      })
      .then(otInstance.deleteArchive_P)
      .then(() => tbConfig.fbArchives.removeArchive(sessionId, archiveId))
      .then(() => aRes.send({ id: archiveId, type }))
      .catch((e) => {
        logger.error('deleteArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function loadConfig() {
    tbConfigPromise = _initialTBConfig();
    return tbConfigPromise;
  }

  function oldVersionCompat(aReq, aRes, aNext) {
    if (!aReq.tbConfig.isWebRTCVersion) {
      aNext();
      return;
    }
    var matches = aReq.path.match(/^\/([^/]+)\.json$/);
    if (matches) {
      aReq.url = '/room/' + matches[1] + '/info';
      aReq.sessionIdField = 'sid';
      logger.log('oldVersionCompat: Rewrote path to: ' + aReq.url);
    }
    aNext();
  }

  return {
    logger,
    configReady,
    iframingOptions,
    featureEnabled,
    loadConfig,
    getRoot,
    getRoom,
    getRoomInfo,
    postRoomArchive,
    postUpdateArchiveInfo,
    getArchive,
    deleteArchive,
    getRoomArchive,
    oldVersionCompat,
  };
}

module.exports = ServerMethods;
