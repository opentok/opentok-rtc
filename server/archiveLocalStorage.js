const { env } = process;
const SwaggerBP = require('swagger-boilerplate');

const { Utils } = SwaggerBP;
const Logger = Utils.MultiLevelLogger;
const Redis = require('ioredis');

const redis = new Redis(env.REDIS_URL || env.REDISTOGO_URL || ''); // uses defaults unless given configuration object

class ArchiveLocalStorage {
  constructor(vonageVideoInstance, roomNameKey, sessionId, aLogLevel) {
    this.vonageVideoInstance = vonageVideoInstance;
    this.roomNameKey = roomNameKey;
    this.sessionId = sessionId;
    this.logger = new Logger('ArchiveLocalStorage', aLogLevel);
  }

  sendBroadcastSignal(archives) {
    this.vonageVideoInstance.sendSignal(
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
      this.sessionId,
    ).catch((error) => this.logger.log('Get archives error:', error));
  }

  async updateArchive(aArchive) {
    const stringSessionInfo = await redis.get(this.roomNameKey);
    const sessionInfo = JSON.parse(stringSessionInfo);
    if (!sessionInfo.archives) sessionInfo.archives = {};

    sessionInfo.archives[aArchive.id] = Object.assign(
      sessionInfo.archives[aArchive.id] || {}, aArchive,
    );

    await redis.set(this.roomNameKey, JSON.stringify(sessionInfo));
    this.sendBroadcastSignal(sessionInfo.archives);
  }

  async removeArchive(aArchiveId) {
    const stringSessionInfo = await redis.get(this.roomNameKey);
    const sessionInfo = JSON.parse(stringSessionInfo);
    delete sessionInfo.archives[aArchiveId];
    await redis.set(this.roomNameKey, JSON.stringify(sessionInfo));
    this.sendBroadcastSignal(sessionInfo.archives);
  }
}

module.exports = ArchiveLocalStorage;
