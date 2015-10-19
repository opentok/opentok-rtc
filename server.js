// This app serves some static content from a static path and serves a REST API that's
// defined on the api.json file (derived from a swagger 2.0 yml file)
// Usage:
// node server [[serverPort] [staticPath]]
//   serverPort: port where the server should listen to petitions.
//   staticPath: path where the static files reside.
// Default values for serverPort and staticPath are:
const DEFAULT_SERVER_PORT = 8123;
const DEFAULT_STATIC_PATH = './web';
const SERVER_LIBS = './server/';
'use strict';

var staticPath = process.argv[3] || DEFAULT_STATIC_PATH;
var serverPort = process.argv[2] || DEFAULT_SERVER_PORT;
var fs = require('fs');
var Utils = require(SERVER_LIBS + '/shared/utils');
var Logger = Utils.MultiLevelLogger;
var logLevel =  Logger.DEFAULT_LEVELS.all;


var logger = new Logger('OpenTokRTC Main', logLevel);

var readFile = Utils.promisify(fs.readFile);

// The API definition is on the api.json file...
readFile('./api.json').then(apiDef => {
  logger.log('api.json file read');

  var app = require('./server/app')(staticPath, apiDef, logLevel);

  logger.log('Starting server at ' + serverPort + ', static path: ' + staticPath);

  app.listen(serverPort);

}).catch(error => {
  logger.error('Error starting server: ', error);
});

