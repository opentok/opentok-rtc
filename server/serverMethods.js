// This file implements the API described in api.yml

// Note: Since we're not putting the TB key and data here, and don't really want
// to have a not-checked-in file for that either, we're just going to store them
// on redis (and they should be already stored when this runs).
// Just run:
// redis-cli set tb_api_key yourkeyhere
// redis-cli set tb_api_secret yoursecrethere
// Once before trying to run this.
// The second argument is only really needed for the unit tests.
function ServerMethods(aLogLevel, aModules) {
  'use strict';
  aModules = aModules || {};

  function ErrorInfo(aCode, aMessage) {
    this.code = aCode;
    this.message = aMessage;
  }

  ErrorInfo.prototype = {
    toString: () => JSON.stringify(this)
  };


  const DEFAULT_USER_NAME = 'Anonymous User';

  // Some Redis keys...
  // OpenTok API key:
  const RED_TB_API_KEY = 'tb_api_key';

  // Timeout (in milliseconds) for polling for archive status change updates. Set this to zero
  // to disable polling. This is the initial timeout (timeout for the first poll).
  const RED_TB_ARCHIVE_POLLING_INITIAL_TIMEOUT = 'tb_archive_polling_initial_timeout';
  // Timeout multiplier. After the first poll (if it fails) the next one will apply this multiplier
  // successively. Set to a lower number to poll often.
  const RED_TB_ARCHIVE_POLLING_TIMEOUT_MULTIPLIER = 'tb_archive_polling_multiplier';

  // OpenTok API Secret
  const RED_TB_API_SECRET ='tb_api_secret';

  // Firebase data URL. This should be the root of the archives section of your Firebase app URL,
  // which isn't necessarily the root of the app.
  const RED_FB_DATA_URL = 'fb_data_url';

  // Firebase secret to generate auth tokens
  const RED_FB_AUTH_SECRET = 'fb_auth_secret';

  // Sessions should not live forever. So we'll store the last time a session was used and if when
  // we fetch it from Redis we determine it's older than this max age (in days). This is the key
  // where that value (in days) should be stored. By default, sessions live two days.
  const RED_TB_MAX_SESSION_AGE = 'tb_max_session_age';

  // Maximum time an empty room will keep it's history alive, in minutes.
  const RED_EMPTY_ROOM_MAX_LIFETIME = 'tb_max_history_lifetime';

  // Chrome AddOn extension Id for sharing screen
  const RED_CHROME_EXTENSION_ID = 'chrome_extension_id';

  // Do we want to allow being used inside an iframe?
  // This can be:
  //  'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
  //        to reflect this, this option only changes what the server allows)
  //  'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
  //  'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
  // We don't allow restricting it to some URIs because it doesn't work on Chrome
  const RED_ALLOW_IFRAMING = 'allow_iframing';

  // List (JSONified array) of the hosts that can hot link to URLs. This same server is always
  // allowed to hot-link
  const RED_VALID_REFERERS = 'valid_referers';

  var env = process.env;

  const REDIS_KEYS = [
    { key: RED_TB_API_KEY, defaultValue: env.TB_API_KEY || null },
    { key: RED_TB_API_SECRET, defaultValue: env.TB_API_SECRET || null },
    { key: RED_TB_ARCHIVE_POLLING_INITIAL_TIMEOUT, defaultValue: env.ARCHIVE_TIMEOUT || 5000 },
    { key: RED_TB_ARCHIVE_POLLING_TIMEOUT_MULTIPLIER, defaultValue: env.TIMEOUT_MULTIPLIER || 1.5 },
    { key: RED_FB_DATA_URL, defaultValue: process.env.FB_DATA_URL || null },
    { key: RED_FB_AUTH_SECRET, defaultValue: process.env.FB_AUTH_SECRET || null },
    { key: RED_TB_MAX_SESSION_AGE, defaultValue: env.TB_MAX_SESSION_AGE || 2 },
    { key: RED_EMPTY_ROOM_MAX_LIFETIME, defaultValue: env.EMPTY_ROOM_LIFETIME || 3 },
    { key: RED_ALLOW_IFRAMING, defaultValue: env.ALLOW_IFRAMING || 'never' },
    { key: RED_VALID_REFERERS, defaultValue: env.VALID_REFERERS || '[]' },
    { key: RED_CHROME_EXTENSION_ID, defaultValue: env.CHROME_EXTENSION_ID || 'undefined' }
  ];

  // A prefix for the room sessionInfo (sessionId + timestamp + inProgressArchiveId).
  // inProgressArchiveId will be present (and not undefined) only if there's an archive
  // operation running on that session.
  // Also note that while we don't actually need to store the in-progress archive operation
  // (and in fact it would be more robust if we didn't!) because we can just call listArchives
  // to get that, it's more efficient if we cache it locally.
  const RED_ROOM_PREFIX = 'otrtc_room__';

  var Utils = require('./shared/utils');
  var Logger = Utils.MultiLevelLogger;
  var promisify = Utils.promisify;

  var URL = require('url');

  var Opentok = aModules.Opentok || require('opentok');

  var FirebaseArchives = require('./firebaseArchives');

  if (aModules.Firebase) {
    FirebaseArchives.Firebase = aModules.Firebase;
  }

  var logger = new Logger('ServerMethods', aLogLevel);

  // We'll use redis to add persistence
  var Redis = require('ioredis');

  const REDIS_CONNECT_TIMEOUT = 5000;

  var redisURL = env.REDIS_URL || env.REDISTOGO_URL || '';
  var redis = new Redis(redisURL, { connectTimeout: REDIS_CONNECT_TIMEOUT });
  var redisWatchdog = setInterval(function() {
    logger.warn('Timeout while connecting to the Redis Server! Is Redis running?');
  }, REDIS_CONNECT_TIMEOUT);

  redis.on('ready', function() {
    logger.log('Successfully connected to Redis and DB is ready.');
    clearInterval(redisWatchdog);
  });

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
    return new Promise((resolve, reject) => {
      var timeout = aTimeout;
      var pollArchive = function _pollArchive() {
        logger.log('Poll [', aArchiveId, ']: polling...');
        aOtInstance.getArchive_P(aArchiveId).then(aArchive => {
          if (aArchive.status === 'available' || aArchive.status === 'uploaded') {
            logger.log('Poll [', aArchiveId, ']: Resolving with', aArchive.status);
            resolve(aArchive);
          } else {
            timeout = timeout * aTimeoutMultiplier;
            logger.log('Poll [', aArchiveId, ']: Retrying in', timeout);
            seTimeout(_pollArchive, timeout);
          }
        });
      };
      logger.log('Poll [', aArchiveId, ']: Setting first try for', timeout);
      setTimeout(pollArchive, timeout);
    });
  }

  function _initialTBConfig() {
    // This will hold the configuration read from Redis
    var redisConfig = {};

    function getArray (aPipeline, aKeyArray) {
      for (var i = 0, l = aKeyArray.length; i < l ; i++) {
        aPipeline = aPipeline.get(aKeyArray[i].key);
      }
      return aPipeline;
    }

    var pipeline = redis.pipeline();
    pipeline = getArray(pipeline, REDIS_KEYS);
    return pipeline.
      exec().
      then(results => {
        // Results should be a n row array of two row arrays...
        // Just so we don't have to C&P a bunch of validations...
        for (var i = 0, l = REDIS_KEYS.length; i < l; i++) {
          var keyValue = results[i][1] || REDIS_KEYS[i].defaultValue;
          // Since we set null as default for mandatory items...
          if (keyValue === null) {
            var message = 'Missing required redis key: ' + REDIS_KEYS[i].key +
              '. Please check the installation instructions';
            logger.error(message);
            throw new Error(message);
          }
          redisConfig[REDIS_KEYS[i].key] = keyValue;
          logger.log('RedisConfig[', REDIS_KEYS[i].key, '] =', keyValue);
        }

        var apiKey = redisConfig[RED_TB_API_KEY];
        var apiSecret = redisConfig[RED_TB_API_SECRET];
        var archivePollingTO = parseInt(redisConfig[RED_TB_ARCHIVE_POLLING_INITIAL_TIMEOUT]);
        var archivePollingTOMultiplier =
          parseFloat(redisConfig[RED_TB_ARCHIVE_POLLING_TIMEOUT_MULTIPLIER]);
        var otInstance = Utils.CachifiedObject(Opentok, apiKey, apiSecret);

        var allowIframing = redisConfig[RED_ALLOW_IFRAMING];
        var validReferers = JSON.parse(redisConfig[RED_VALID_REFERERS]);

        // This isn't strictly necessary... but since we're using promises all over the place, it
        // makes sense. The _P are just a promisified version of the methods. We could have
        // overwritten the original methods but this way we make it explicit. That's also why we're
        // breaking camelCase here, to make it patent to the reader that those aren't standard
        // methods of the API.
        ['startArchive', 'stopArchive', 'getArchive', 'listArchives', 'deleteArchive'].
          forEach(method => otInstance[method + '_P'] = promisify(otInstance[method]));

        var maxSessionAge = parseInt(redisConfig[RED_TB_MAX_SESSION_AGE]);
        var chromeExtId = redisConfig[RED_CHROME_EXTENSION_ID];

        // For this object we need to know if/when we're reconnecting so we can shutdown the
        // old instance.
        var oldFirebaseArchivesPromise = Utils.CachifiedObject.getCached(FirebaseArchives);

        var firebaseArchivesPromise =
          Utils.CachifiedObject(FirebaseArchives, redisConfig[RED_FB_DATA_URL],
                                redisConfig[RED_FB_AUTH_SECRET],
                                redisConfig[RED_EMPTY_ROOM_MAX_LIFETIME], aLogLevel);

        oldFirebaseArchivesPromise && (firebaseArchivesPromise !== oldFirebaseArchivesPromise) &&
          oldFirebaseArchivesPromise.then(aFirebaseArchive => aFirebaseArchive.shutdown());

        return firebaseArchivesPromise.
          then(firebaseArchives => {
            return {
              firebaseArchivesPromise: firebaseArchivesPromise,
              otInstance: otInstance,
              apiKey: apiKey,
              apiSecret: apiSecret,
              archivePollingTO: archivePollingTO,
              archivePollingTOMultiplier: archivePollingTOMultiplier,
              maxSessionAgeMs: maxSessionAge * 24 * 60 * 60 * 1000,
              fbArchives: firebaseArchives,
              allowIframing: allowIframing,
              validReferers: validReferers,
              chromeExtId: chromeExtId
            };
          });
      });
  }

  function configReady(aReq, aRes, aNext) {
    tbConfigPromise.then(tbConfig => {
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

  // Update archive callback. TO-DO: Is there any way of restricting calls to this?
  function postUpdateArchiveInfo(aReq, aRes) {
    var archive = aReq.body;
    var tbConfig = aReq.tbConfig;
    var fbArchives = tbConfig.fbArchives;
    if (!archive.sessionId || !archive.id) {
      logger.log('postUpdateArchiveInfo: Got an invalid call! Ignoring.', archive);
    } else if (archive.status === 'available' || archive.status === 'updated') {
      logger.log('postUpdateArchiveInfo: Updating information for archive:', archive.id);
      tbConfig.fbArchives.updateArchive(archive.sessionId, archive);
    } else {
      logger.log('postUpdateArchiveInfo: Ignoring updated status for', archive.id, ':',
                 archive.status);
    }
    aRes.send({});
  }

  // aHost is the host header (so it's really host[:port])
  // aReferer is the refere header (so it's an URL or '' or undefined)
  // aValidList is a list of hostnames that are valid (on any port?)
  function checkValidReferer(aMyHost, aReferer, aValidList) {
    logger.log('checkValidReferer(', aMyHost, aReferer, aValidList, ')');
    // First: no referer means direct load and that's valid always
    if (!aReferer || aReferer === '') {
      return true;
    }
    var refererData = URL.parse(aReferer);

    // Second: my own host is always a valid referer
    if (refererData.host === aMyHost) {
      return true;
    }

    // And finally, if the host is on the valid list then it's valid also
    var hostname = refererData.hostname;
    return aValidList.some(aHostInList => aHostInList === hostname);
  }

  // Return the personalized HTML for a room.
  function getRoom(aReq, aRes) {
    logger.log('getRoom serving ' + aReq.path, 'roomName:', aReq.params.roomName,
               'userName:', aReq.query && aReq.query.userName);
    var userName = aReq.query && aReq.query.userName;
    var tbConfig = aReq.tbConfig;

    if (!checkValidReferer(aReq.get('host'), aReq.get('referer'), tbConfig.validReferers)) {
      aRes.status(403).send(new ErrorInfo(1001, 'Hot-linking is forbidden'));
      return;
    }

    // We really don't want to cache this
    aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    aRes.set('Pragma', 'no-cache');
    aRes.set('Expires', 0);

    aRes.
      render('room.ejs',
             {
               userName: userName || DEFAULT_USER_NAME,
               roomName: aReq.params.roomName,
               chromeExtensionId: tbConfig.chromeExtId
             });
  }

  // Given a sessionInfo (which might be empty or non usable) returns a promise than will fullfill
  // to an usable sessionInfo. This function cannot be invoked directly, it has
  // to be bound so 'this' is a valid Opentok instance!
  function _getUsableSessionInfo(aMaxSessionAge, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve) => {
      var minLastUsage = Date.now() - aMaxSessionAge;

      logger.log('getUsableSessionInfo. aSessionInfo:', JSON.stringify(aSessionInfo),
                 'minLastUsage: ', minLastUsage, 'maxSessionAge:', aMaxSessionAge);

      if (!aSessionInfo || aSessionInfo.lastUsage <= minLastUsage) {
        // We need to create a new session...
        this.
          createSession({ mediaMode: 'routed' }, (error, session) => {
            resolve({
              sessionId: session.sessionId,
              lastUsage: Date.now(),
              inProgressArchiveId: undefined
            });
          });
      } else {
        // We only need to update the last usage data...
        resolve({
          sessionId: aSessionInfo.sessionId,
          lastUsage: Date.now(),
          inProgressArchiveId: aSessionInfo.inProgressArchiveId
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
    var roomName = aReq.params.roomName;
    var userName =
      (aReq.query && aReq.query.userName) || DEFAULT_USER_NAME + _numAnonymousUsers++;
    logger.log('getRoomInfo serving ' + aReq.path, 'roomName: ', roomName, 'userName: ', userName);

    // We have to check if we have a session id stored already on redis (and if it's not too old).
    // Note that we do not store tokens on the Redis database.
    redis.
      get(RED_ROOM_PREFIX + roomName).
      then(_getUsableSessionInfo.bind(tbConfig.otInstance, tbConfig.maxSessionAgeMs)).
      then(usableSessionInfo => {
        // Update the database. We could do this on getUsable...
        redis.set(RED_ROOM_PREFIX + roomName, JSON.stringify(usableSessionInfo));

        // We have to create an authentication token for the new user...
        var fbUserToken = fbArchives.createUserToken(usableSessionInfo.sessionId, userName);

        // and finally, answer...
        aRes.send({
          sessionId: usableSessionInfo.sessionId,
          apiKey: tbConfig.apiKey,
          token: tbConfig.otInstance.
                  generateToken(usableSessionInfo.sessionId, {
                    role: 'publisher',
                    data: JSON.stringify({ userName: userName })
                  }),
          username: userName,
          firebaseURL: fbArchives.baseURL + '/' + usableSessionInfo.sessionId,
          firebaseToken: fbUserToken,
          chromeExtId: tbConfig.chromeExtId
        });
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
      return aTbConfig.otInstance.
        getArchive_P(aSessionInfo.inProgressArchiveId).
        then(aArchiveInfo => {
          if (aArchiveInfo.status === 'started') {
            throw new ErrorInfo(102, 'Recording already in progress');
          } else {
            aSessionInfo.inProgressArchiveId = undefined;
          }
          return aSessionInfo;
        }).catch(e => {
          if (e.code === 102) {
            throw e;
          }
          // This should mean that the archive doesn't exist. Just go with the flow...
          aSessionInfo.inProgressArchiveId = undefined;
          return aSessionInfo;
        });
    } else if (aOperation.startsWith('stop') && !aSessionInfo.inProgressArchiveId) {
      return aTbConfig.otInstance.listArchives_P({ offset: 0, count: 1 }).
        then(aArchives => {
          var recordingInProgress = aArchives[0] && aArchives[0].status === 'started';
          if (recordingInProgress) {
            aSessionInfo.inProgressArchiveId = aArchives[0].id;
          } else {
            throw new ErrorInfo(105, 'Cannot stop a non existant recording');
          }
        });
    } else {
      // We might still need to update the archive information but for now consider it's valid.
      return aSessionInfo;
    }
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
    var roomName = aReq.params.roomName;
    var userName = body.userName;
    var operation = body.operation;
    var otInstance = tbConfig.otInstance;

    logger.log('postRoomArchive serving ' + aReq.path, 'roomName:', roomName,
               'userName:', userName);
    // We could also keep track of the current archive ID on the client app. But the proposed
    // API makes it simpler for the client app, since it only needs the room name to stop an
    // in-progress recording. So we can just get the sessionInfo from redis.
    redis.
      get(RED_ROOM_PREFIX + roomName).
      then(_getUpdatedArchiveInfo.bind(undefined, tbConfig, operation)).
      then(sessionInfo => {
        var now = new Date();
        var archiveOptions = {
          name: userName + ' ' +  now.toLocaleDateString() + ' ' + now.toLocaleTimeString()
        };
        var archiveOp;
        switch (operation) {
          case 'startIndividual':
            archiveOptions.outputMode = 'individual';
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
        return archiveOp().then(aArchive => {
          sessionInfo.inProgressArchiveId = aArchive.status === 'started' ? aArchive.id : undefined;
          // Update the internal database
          redis.set(RED_ROOM_PREFIX + roomName, JSON.stringify(sessionInfo));

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

          readyToUpdateExternalDb.
            then(aUpdatedArchive => {
              aUpdatedArchive.localDownloadURL = '/archive/' + aArchive.id;
              operation !== 'stop' ? aUpdatedArchive.recordingUser = userName : '';
              tbConfig.fbArchives.updateArchive(sessionInfo.sessionId, aUpdatedArchive);
            });

          logger.log('postRoomArchive => Returning archive info: ', aArchive.id);
          aRes.send({
            archiveId: aArchive.id,
            archiveType: aArchive.outputMode
          });

        });
      }).
      catch(error => {
        logger.log('postRoomArchive. Sending error:', error);
        aRes.status(400).send(error);
      });
  }

  function getArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    logger.log('getAchive:', archiveId);
    aReq.tbConfig.otInstance.
      getArchive_P(archiveId).
      then(aArchive => {
        aRes.redirect(301, aArchive.url);
      }).catch(e => {
        logger.error('getArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function deleteArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    logger.log('deleteArchive:', archiveId);
    var tbConfig = aReq.tbConfig;
    var otInstance = tbConfig.otInstance;
    var sessionId, type;
    otInstance.
      getArchive_P(archiveId). // This is only needed so we can get the sesionId
      then(aArchive => {
        sessionId = aArchive.sessionId;
        type = aArchive.outputMode;
        return archiveId;
      }).
      then(otInstance.deleteArchive_P).
      then(() => tbConfig.fbArchives.removeArchive(sessionId, archiveId)).
      then(() => aRes.send({ id: archiveId, type: type })).
      catch(e => {
        logger.error('deleteArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function loadConfig() {
    tbConfigPromise = _initialTBConfig();
    return tbConfigPromise;
  }

  return {
    logger: logger,
    configReady: configReady,
    iframingOptions: iframingOptions,
    loadConfig: loadConfig,
    getRoom: getRoom,
    getRoomInfo: getRoomInfo,
    postRoomArchive: postRoomArchive,
    postUpdateArchiveInfo: postUpdateArchiveInfo,
    getArchive: getArchive,
    deleteArchive: deleteArchive
  };

}

module.exports = ServerMethods;
