// This app serves some static content from a static path and serves a REST API that's
// defined on the api.json file (derived from a swagger 2.0 yml file)
// The last parameter is only actually needed (and used) for the unit tests
module.exports = function App(aStaticPath, aApiDef, aLogLevel, aModules) {
  'use strict';

  var Utils = require('./shared/utils');
  var Logger = Utils.MultiLevelLogger;
  var logger = new Logger('HTTP Server App', aLogLevel);

  logger.log('Starting process');

  var api = JSON.parse(aApiDef);
  var paths = api.paths;

  // This holds the module that implements the methods...
  var implModule = api['x-implementation-module'];
  logger.log('Loading implementation module (' + implModule);

  var serverImpl = new (require('./' + implModule))(aLogLevel, aModules);

  logger.log('Implementation module (' + implModule + ' read!');

  var express = require('express');
  var app = express();

  logger.log('Setting shared directory /shared/js handler to', __dirname + '/shared');
  app.use('/shared/js', express.static(__dirname + '/shared'));
  app.use(express.static(aStaticPath));

  // TO-DO: Do we want this to be CORS friendly? Probably not...

  // Use body-parse to fetch the parameters
  var bodyParser = require('body-parser');
  var urlencodedParser = bodyParser.urlencoded({extended: false});

  // And use EJS as a view engine
  app.set('view engine', 'ejs');

  // Add the middleware, if needed
  var middleware = api['x-implementation-middleware'];
  serverImpl[middleware] && app.use(serverImpl[middleware]);

  // And add the implementation functions for each paths
  Object.keys(paths).forEach(path => {
    Object.keys(paths[path]).forEach(verb => {
      var expressifiedPath = path.replace(/{/g, ':').replace(/}/g,'');
      var implementation = paths[path][verb]['x-implemented-in'];
      logger.log('Adding ' + verb + ': ' + expressifiedPath + ' => ' + implementation);
      if (verb === 'post' || verb === 'delete') {
        app[verb](expressifiedPath, urlencodedParser, serverImpl[implementation]);
      } else {
        app[verb](expressifiedPath, serverImpl[implementation]);
      }
    });
  });

  // I don't need this anymore.
  api = null;
  return app;
};
