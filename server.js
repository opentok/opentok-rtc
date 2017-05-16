// This app serves some static content from a static path and serves a REST API that's
// defined on the api.yaml swagger 2.0 file
// Usage:
// node server -h

var Server = require('swagger-boilerplate').Server;

var server =
 new Server({
   apiFile: './api.yml',
   modulePath: __dirname + '/server/',
   appName: 'OpentokRTC-V2 Main'
 });

server.start();
