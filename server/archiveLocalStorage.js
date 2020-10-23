'use strict';

var env = process.env;
var SwaggerBP = require('swagger-boilerplate');
var Utils = SwaggerBP.Utils;
var Logger = Utils.MultiLevelLogger;
const Redis = require("ioredis");
const redis = new Redis(env.REDIS_URL || env.REDISTOGO_URL || ''); // uses defaults unless given configuration object

class ArchiveLocalStorage {
  constructor(otInstance, roomNameKey, sessionId, aLogLevel) {
    this.otInstance = otInstance;
    this.roomNameKey = roomNameKey;
    this.sessionId = sessionId;
    this.logger = new Logger('ArchiveLocalStorage', aLogLevel);
  }

  sendBroadcastSignal(archives) {
    this.otInstance.signal(
      this.sessionId,
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
          return this.logger.log('Get archives error:', error);
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
          this.sendBroadcastSignal(sessionInfo.archives);
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
          this.sendBroadcastSignal(sessionInfo.archives);
        });
      });
    });
  }

}
  
module.exports = ArchiveLocalStorage;
