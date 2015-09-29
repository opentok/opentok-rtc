// This app serves some static content from a static path and serves a REST API that's
// defined on the api.json file (derived from a swagger 2.0 yml file)
// Usage:
// node server [[serverPort] [staticPath]]
//   serverPort: port where the server should listen to petitions.
//   staticPath: path where the static files reside
// Default values for serverPort and staticPath are:

'use strict';

const DEFAULT_SERVER_PORT = 8123;
const DEFAULT_STATIC_PATH = './web';
const SERVER_LIBS = './server/';

var staticPath = process.argv[3] || DEFAULT_STATIC_PATH;
var serverPort = process.argv[2] || DEFAULT_SERVER_PORT;


var fs = require('fs');
var Utils = require(SERVER_LIBS + 'utils');
var Logger = Utils.MultiLevelLogger;

var logger = new Logger('OpenTokRTC main', Logger.DEFAULT_LEVELS.all);

var readFile = Utils.promisify(fs.readFile);


logger.log('ARGS: ', JSON.stringify(process.argv));

// The API definition is on the api.json file...
readFile('./api.json').then(apiDef => {
  logger.log('api.json file read');

  var api = JSON.parse(apiDef);
  var paths = api.paths;

  // This holds the module that implements the methods...
  var implModule = api['x-implementation-module'];
  var serverImpl = require(SERVER_LIBS + implModule);

  logger.log('Implementation module (' + implModule + ' read!');

  var express = require('express');
  var app = express();

  app.use(express.static(staticPath, {index: false}));

  // TO-DO: Do we want this to be CORS friendly? Probably not...

  // Use body-parse to fetch the parameters
  var bodyParser = require('body-parser');
  app.use(bodyParser.json());

  // And use EJS as a view engine
  app.set('view engine', 'ejs');

  // Add the middleware, if needed
  var middleware = api['x-implementation-middleware'];
  middleware && serverImpl[middleware] && app.use(serverImpl[middleware]);

  // And add the implementation functions for each paths
  Object.keys(paths).forEach(path => {
    Object.keys(paths[path]).forEach(verb => {
      var expressifiedPath = path.replace('{', ':').replace('}','');
      var implementation = paths[path][verb]['x-implemented-in'];
      logger.log('Adding ' + verb + ': ' + expressifiedPath + ' => ' + implementation);
      app[verb](expressifiedPath, serverImpl[implementation]);
    });
  });

  logger.log('Starting server at ' + serverPort + ', static path: ' + staticPath);

  // I don't need this anymore.
  api = null;
  app.listen(serverPort);
}).catch(error => logger.error(error));

