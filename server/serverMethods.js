// This file implements the API described in api.yml

// Note: Since we're not putting the TB key and data here, and don't really want
// to have a not-checked-in file for that either, we're just going to store them
// on redis (and they should be already stored when this runs).
// Just run:
// redis-cli set tb_api_key yourkeyhere
// redis-cli set tb_api_secret yoursecrethere
// Once before trying to run this.
function ServerMethods() {
  'use strict';

  const DEFAULT_USER_NAME = 'Anonymous User';

  // Some Redis keys...
  // The API key:
  const RED_TB_API_KEY = 'tb_api_key';

  // The API Secret
  const RED_TB_API_SECRET = 'tb_api_secret';

  // Sessions should not live forever. So we'll store the last time a session was used and if when
  // we fetch it from Redis we determine it's older than this max age (in days). This is the key
  // where that value (in days) should be stored
  const RED_MAX_SESSION_AGE = 'tb_max_session_age';
  // And this is the default in case redis doesn't have that stored.
  const DEFAULT_MAX_AGE_DAYS = 2;

  // A prefix for the room sessionInfo (sessionId + timestamp)
  const RED_ROOM_PREFIX = 'otrtc_room__';

  var Logger = new require('./utils').MultiLevelLogger;

  var Opentok = require('opentok');

  var logger = new Logger("ServerMethods", Logger.DEFAULT_LEVELS.all);

  // We'll use redis to add persistence
  var Redis = require('ioredis');
  var redis = new Redis();

  // Opentok API instance, which will be configured only after tbConfigPromise
  // is resolved
  var opentok;
  var tbConfigPromise = _initialTBConfig();

  function _initialTBConfig() {
    var pipeline = redis.pipeline();
    return pipeline.
      get(RED_TB_API_KEY).
      get(RED_TB_API_SECRET).
      get(RED_MAX_SESSION_AGE).
      exec().
      then(results => {
        // Results should be a three row array of two row arrays...
        var apiKey = results[0][1];
        var apiSecret = results[1][1];
        var maxSessionAge = results[2][1] || DEFAULT_MAX_AGE_DAYS;

        if (apiKey && apiSecret) {
          opentok = new Opentok(apiKey, apiSecret);
          return {
            apiKey: apiKey,
            apiSecret: apiSecret,
            maxSessionAgeMs: maxSessionAge * 24 * 60 * 60 * 1000
          };
        } else {
          throw new Error('Cannot get the API key or API secret from redis');
        }
      }).catch(error => {
        logger.error('Cannot get the API key or API secret from redis');
        throw error;
      }
    );
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
  // to an usable sessionInfo
  function _getUsableSessionInfo(aMaxSessionAge, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve, reject) => {
      var minLastUsage = Date.now() - aMaxSessionAge;

      logger.log('getUsableSessionInfo. aSessionInfo:', JSON.stringify(aSessionInfo),
                 'minLastUsage: ', minLastUsage, 'maxSessionAge:', aMaxSessionAge);

      if (!aSessionInfo || aSessionInfo.lastUsage <= minLastUsage) {
        // We need to create a new session...
        opentok.
          createSession({mediaMode: 'routed'}, (error, session) => {
            resolve({
              sessionId: session.sessionId,
              lastUsage: Date.now()
            });
          });
      } else {
        // We only need to update the last usage data...
        resolve({
          sessionId: aSessionInfo.sessionId,
          lastUsage: Date.now()
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
  //   firebasePw: string // TBD!
  // }
  var _numAnonymousUsers = 1;
  function getRoomInfo(aReq, aRes) {
    var roomName = aReq.params.roomName;
    var userName =
      (aReq.query && aReq.query.userName) || DEFAULT_USER_NAME + _numAnonymousUsers++;
    logger.log('getRoomInfo serving ' + aReq.path, 'roomName: ', roomName, 'userName: ', userName);

    // We have to check if we have a session id stored already on redis (and if it's not too old).
    // Note that we do not store tokens on the Redis database.
    redis.
      get(RED_ROOM_PREFIX + roomName).
      then(_getUsableSessionInfo.bind(undefined, aReq.tbConfig.maxSessionAgeMs)).
      then(usableSessionInfo => {
        // Update the database. We could do this on getUsable...
        redis.set(RED_ROOM_PREFIX + roomName, JSON.stringify(usableSessionInfo));

        // and finally, answer...
        aRes.send({
          sessionId: usableSessionInfo.sessionId,
          apiKey: aReq.tbConfig.apiKey,
          token: opentok.
                  generateToken(usableSessionInfo.sessionId, {
                    role: 'publisher',
                    data: JSON.stringify({userName: userName})
                  }),
          username: userName,
          firebasePw: "NOT IMPLEMENTED YET"
        });
      });
  }

  function postRoomArchive(aReq, aRes) {
  }

  function getArchive(aReq, aRes) {
  }

  function deleteArchive(aReq, aRes) {
  }

  return {
    configReady: waitForTB,
    getRoom: getRoom,
    getRoomInfo: getRoomInfo,
    postRoomArchive: postRoomArchive,
    getArchive: getArchive,
    deleteArchive: deleteArchive
  };

};

module.exports = new ServerMethods();
