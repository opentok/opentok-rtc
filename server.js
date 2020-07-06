// This app serves some static content from a static path and serves a REST API that's
// defined on the api.yaml swagger 2.0 file
// Usage:
// node server -h

var SwaggerBP = require('swagger-boilerplate');
var Utils = SwaggerBP.Utils;
var Logger = Utils.MultiLevelLogger;
var logger = new Logger('HTTP Server App');

var Server = require('swagger-boilerplate').Server;

var server =
 new Server({
   apiFile: './api.yml',
   modulePath: __dirname + '/server/',
   appName: 'OpenTokRTC Main',
   staticOptions: {
     dotfiles: 'ignore',
     extensions: ['jpg'],
     index: false,
     redirect: false,
   }
 });

server.start();
