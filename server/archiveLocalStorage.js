'use strict';

var SwaggerBP = require('swagger-boilerplate');
var env = process.env;
const Redis = require("ioredis");
const redis = new Redis(env.REDIS_URL || env.REDISTOGO_URL || ''); // uses defaults unless given configuration object
 /*
// Time is in minutes but we need it in ms.
  aCleanupTime = aCleanupTime * 60 * 1000;

  var Utils = SwaggerBP.Utils;
  var Logger = Utils.MultiLevelLogger;

 */

class ArchiveLocalStorage {
  constructor(otInstance, roomNameKey) {
    this.otInstance = otInstance;
    this.roomNameKey = roomNameKey;
  }

  sendBroadcastSignal(sessionId, archives) {
    this.otInstance.signal(
      sessionId,
      null,
      {
        type: 'archives',
        data: JSON.stringify({
          _head: {
            id: 1,
            seq: 1,
            tot: 1,
          },
          data: archives,
        }),
      },
      (error) => {
        if (error) {
          console.error(error);
          //return logger.log('Get archives error:', error);
        }
        return false;
      });
  };

  updateArchive(aArchive) {
    // We will do this in the background... it shouldn't be needed to stop answering till this
    // is done.
    return new Promise((resolve) => {
      redis.get(this.roomNameKey).then((sessionInfo) => {
        sessionInfo = JSON.parse(sessionInfo);

        if (!sessionInfo.archives) sessionInfo.archives = {};
        sessionInfo.archives[aArchive.id] = aArchive;

        redis.set(this.roomNameKey, JSON.stringify(sessionInfo)).then((listo) => {
          //if (enableArchiveManager) {
          this.sendBroadcastSignal(sessionInfo.sessionId, sessionInfo.archives);
        });
      });
    });        
  }

  removeArchive(aArchiveId) {
    return new Promise((resolve) => {
      redis.get(this.roomNameKey).then((sessionInfo) => {
        sessionInfo = JSON.parse(sessionInfo);
        delete sessionInfo.archives[aArchiveId];
        redis.set(this.roomNameKey, sessionInfo).then((listo) => {
          // if (enableArchiveManager) {
          this.sendBroadcastSignal(sessionInfo.aSessionId, sessionInfo.archives);
        });
      });
    });
  }

}
  
module.exports = ArchiveLocalStorage;
