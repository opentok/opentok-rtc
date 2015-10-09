// This app serves some static content from a static path and serves a REST API that's
// defined on the api.json file (derived from a swagger 2.0 yml file)
// Usage:
// node server [[serverPort] [staticPath]]
//   serverPort: port where the server should listen to petitions.
//   staticPath: path where the static files reside
// Default values for serverPort and staticPath are:

module.exports = function App(staticPath, apiDef, logLevel) {
  'use strict';

  var Utils = require('./utils');

  var Logger = Utils.MultiLevelLogger;

  var logger = new Logger('HTTP Server App', logLevel);

  var api = JSON.parse(apiDef);
  var paths = api.paths;

  // This holds the module that implements the methods...
  var implModule = api['x-implementation-module'];
  logger.log('Loading implementation module (' + implModule);

  var serverImpl = new (require('./' + implModule))(logLevel);

  logger.log('Implementation module (' + implModule + ' read!');

  var express = require('express');
  var app = express();

  app.use(express.static(staticPath));

  // TO-DO: Do we want this to be CORS friendly? Probably not...

  // Use body-parse to fetch the parameters
  var bodyParser = require('body-parser');
  app.use(bodyParser.json());

  // And use EJS as a view engine
  app.set('view engine', 'ejs');

  // Add the middleware, if needed
  var middleware = api['x-implementation-middleware'];
  serverImpl[middleware] && app.use(serverImpl[middleware]);

  // And add the implementation functions for each paths
  Object.keys(paths).forEach(path => {
    Object.keys(paths[path]).forEach(verb => {
      var expressifiedPath = path.replace('{', ':').replace('}','');
      var implementation = paths[path][verb]['x-implemented-in'];
      logger.log('Adding ' + verb + ': ' + expressifiedPath + ' => ' + implementation);
      app[verb](expressifiedPath, serverImpl[implementation]);
    });
  });

  // I don't need this anymore.
  api = null;
  return app;
};
