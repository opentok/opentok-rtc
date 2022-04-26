// This app serves some static content from a static path and serves a REST API that's
// defined on the api.yaml swagger 2.0 file
// Usage:
// node server -h
const { Server } = require('swagger-boilerplate');
const { WebSocketServer } = require('ws');
const redis = require('./server/redis');

const wss = new WebSocketServer({ port: 8000 });

const server = new Server({
  apiFile: './api.yml',
  modulePath: `${__dirname}/server/`,
  appName: 'OpenTokRTC Main',
  staticOptions: {
    dotfiles: 'ignore',
    extensions: ['jpg'],
    index: false,
    redirect: false,
  },
});

server.start();

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    console.log('received: %s', data);
    try {
      const {
        msg,
        roomURI,
        streamId,
        score,
      } = JSON.parse(data);
      const redisPrefix = `${roomURI}:${streamId}`;
      if (msg === 'SET-ATTENTION') {
        await redis.rpush(redisPrefix, JSON.stringify({ timestamp: Date.now(), score }));
        await redis.expire(redisPrefix, 1800); // 30 minutes
      } else if (msg === 'GET-ATTENTION') {
        const attentionDataPoints = await redis.lrange(redisPrefix, 0, -1);
        ws.send(JSON.stringify({ msg: 'SERVER-GET-ATTENTION', dataPoints: attentionDataPoints }));
      } else {
        console.log('Unknown websocket message');
      }
    } catch (e) {
      console.log('Error', e);
    }
  });
});
