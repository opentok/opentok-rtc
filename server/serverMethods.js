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

  const REDIS_KEYS = [
    { key: RED_TB_API_KEY, defaultValue: null },
    { key: RED_TB_API_SECRET, defaultValue: null },
    { key: RED_FB_DATA_URL, defaultValue: null },
    { key: RED_FB_AUTH_SECRET, defaultValue: null },
    { key: RED_TB_MAX_SESSION_AGE, defaultValue: 2 },
    { key: RED_EMPTY_ROOM_MAX_LIFETIME, defaultValue: 3 }
  ];

  // This will hold the configuration read from Redis
  var redisConfig = {};

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

  var Opentok = aModules.Opentok || require('opentok');

  var FirebaseArchives = require('./firebaseArchives');

  if (aModules.Firebase) {
    FirebaseArchives.Firebase = aModules.Firebase;
  }

  var logger = new Logger('ServerMethods', aLogLevel);

  // We'll use redis to add persistence
  var Redis = require('ioredis');
  var redis = new Redis();

  // Opentok API instance, which will be configured only after tbConfigPromise
  // is resolved
  var tbConfigPromise = _initialTBConfig();

  function _initialTBConfig() {
    function getArray (aPipeline, aKeyArray) {
      for (var i = 0, l = aKeyArray.length; i < l ; i++) {
        aPipeline = aPipeline.get(aKeyArray[i].key);
      }
      return aPipeline;
    };

    var pipeline = redis.pipeline();
    pipeline = getArray(pipeline, REDIS_KEYS);
    return pipeline.
      exec().
      then(results => {
        // Results should be a n row array of two row arrays...
        // Just so we don't have to C&P a bunch of validations...
        for (var i = 0, l = REDIS_KEYS.length; i < l; i++) {
          var keyValue = results[i][1] || REDIS_KEYS[i].defaultValue;
          if (!keyValue) {
            var message = 'Missing required redis key: ' + REDIS_KEYS[i] +
              '. Please check the installation instructions';
            logger.error(message);
            throw new Error(message);
          }
          redisConfig[REDIS_KEYS[i].key] = keyValue;
        }

        var apiKey = redisConfig[RED_TB_API_KEY];
        var apiSecret = redisConfig[RED_TB_API_SECRET];
        var maxSessionAge = redisConfig[RED_TB_MAX_SESSION_AGE];
        var otInstance = new Opentok(apiKey, apiSecret);

        // This isn't strictly necessary... but since we're using promises all over the place, it
        // makes sense. The _P are just a promisified version of the methods. We could have
        // overwritten the original methods but this way we make it explicit. That's also why we're
        // breaking camelCase here, to make it patent to the reader that those aren't standard
        // methods of the API.
        ['startArchive', 'stopArchive', 'getArchive', 'listArchives'].
          forEach(method => otInstance[method + '_P'] = promisify(otInstance[method]));

        var firebaseArchivesPromise =
          FirebaseArchives(redisConfig[RED_FB_DATA_URL],
                           redisConfig[RED_FB_AUTH_SECRET],
                           redisConfig[RED_EMPTY_ROOM_MAX_LIFETIME],
                           aLogLevel);
        return firebaseArchivesPromise.
          then(firebaseArchives => {
            return {
              otInstance: otInstance,
              apiKey: apiKey,
              apiSecret: apiSecret,
              maxSessionAgeMs: maxSessionAge * 24 * 60 * 60 * 1000,
              fbArchives: firebaseArchives
            };
          });
      });
  }

  function waitForTB(aReq, aRes, aNext) {
    tbConfigPromise.then(tbConfig => {
      aReq.tbConfig = tbConfig;
      aNext();
    });
  }

  // Return the personalized HTML for a room.
  function getRoom(aReq, aRes) {
    logger.log('getRoom serving ' + aReq.path, 'roomName:', aReq.params.roomName,
               'userName:', aReq.query && aReq.query.userName);
    var userName = aReq.query && aReq.query.userName;
    aRes.
      render('room.ejs',
             {
               userName: userName || DEFAULT_USER_NAME,
               roomName: aReq.params.roomName
             });
  }

  // Given a sessionInfo (which might be empty or non usable) returns a promise than will fullfill
  // to an usable sessionInfo. This function cannot be invoked directly, it has
  // to be bound so 'this' is a valid Opentok instance!
  function _getUsableSessionInfo(aMaxSessionAge, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve, reject) => {
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
  //   sessionId:	string
  //   apiKey: string
  //   token:	string
  //   username: string
  //   firebaseURL: string
  //   firebasePw: string
  // }
  var _numAnonymousUsers = 1;
  function getRoomInfo(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var fbArchives = aReq.tbConfig.fbArchives;
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
          firebasePw: fbUserToken
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
  };

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

        var archiveOptions = {
          name: userName // We'll use the archive name to indicate who started the recording.
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
          // And update the external database also!
          aArchive.localDownloadURL = '/archive/' + aArchive.id;
          tbConfig.fbArchives.updateArchive(sessionInfo.sessionId, aArchive);
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
        logger.error('getArchive error: ', e);
        aRes.status(405).send(e);
      });
  }

  function deleteArchive(aReq, aRes) {
    aRes.sendStatus(405);
  }

  return {
    logger: logger,
    configReady: waitForTB,
    getRoom: getRoom,
    getRoomInfo: getRoomInfo,
    postRoomArchive: postRoomArchive,
    getArchive: getArchive,
    deleteArchive: deleteArchive
  };

};

module.exports = ServerMethods;
