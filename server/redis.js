const { env } = process;
const Redis = require('ioredis');

console.log('Initing REDISS:::');

const redis = new Redis(env.REDIS_URL || env.REDISTOGO_URL || ''); // uses defaults unless given configuration object

module.exports = redis;
