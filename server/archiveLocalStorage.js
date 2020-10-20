'use strict';

var SwaggerBP = require('swagger-boilerplate');
var Utils = SwaggerBP.Utils;
var Logger = Utils.MultiLevelLogger;
var env = process.env;
const Redis = require("ioredis");
const redis = new Redis(env.REDIS_URL || env.REDISTOGO_URL || ''); // uses defaults unless given configuration object
var logger = new Logger('ArchiveLocalStorage', 'debug');
 /*
// Time is in minutes but we need it in ms.
  aCleanupTime = aCleanupTime * 60 * 1000;
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
          return logger.log('Get archives error:', error);
        }
        return false;
      });
  };

  updateArchive(aArchive) {
    return new Promise((resolve) => {
      redis.get(this.roomNameKey).then((sessionInfo) => {
        sessionInfo = JSON.parse(sessionInfo);

        if (!sessionInfo.archives) sessionInfo.archives = {};
        sessionInfo.archives[aArchive.id] = aArchive;

        redis.set(this.roomNameKey, JSON.stringify(sessionInfo)).then((ready) => {
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
        redis.set(this.roomNameKey, JSON.stringify(sessionInfo)).then((ready) => {
          this.sendBroadcastSignal(sessionInfo.sessionId, sessionInfo.archives);
        });
      });
    });
  }

}
  
module.exports = ArchiveLocalStorage;
