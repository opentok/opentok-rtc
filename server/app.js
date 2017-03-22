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
  logger.log('Loading implementation module:', implModule);

  var serverImpl = new (require('./' + implModule))(aLogLevel, aModules);

  logger.log('Implementation module (', implModule, ') read!');

  var express = require('express');
  var app = express();

  logger.log('Setting shared directory /shared/js handler to', __dirname + '/shared');
  app.use('/shared/js', express.static(__dirname + '/shared'));
  app.use(express.static(aStaticPath));

  // TO-DO: Do we want this to be CORS friendly? Probably not...

  // Use body-parse to fetch the parameters
  var bodyParser = require('body-parser');
  var urlencodedParser = bodyParser.urlencoded({extended: false});
  // create application/json parser
  var jsonParser = bodyParser.json();


  // And use EJS as a view engine
  app.set('view engine', 'ejs');

  // Add the middleware, if needed
  var middleware = api['x-implementation-middleware'];
  middleware = Array.isArray(middleware) ? middleware : [middleware];
  middleware.forEach(aMiddleware => {
    logger.log('Using middleware: ', aMiddleware);
    serverImpl[aMiddleware] && app.use(serverImpl[aMiddleware]);
  });

  // Does the implementation require configuration?
  var configureApp = serverImpl[api['x-implementation-configuration']];

  // And add the implementation functions for each paths
  Object.keys(paths).forEach(path => {
    Object.keys(paths[path]).forEach(verb => {
      var expressifiedPath = path.replace(/{/g, ':').replace(/}/g,'');
      var apiInfo = paths[path][verb];
      var implementation = apiInfo['x-implemented-in'];
      logger.log('Adding ' + verb + ': ' + expressifiedPath + ' => ' + implementation);
      if (verb === 'post' || verb === 'delete') {
        var parameters = apiInfo['parameters'];
        // If there is any parameter that is in form format use the urlencoded parser, otherwise
        // use the json parser. Note that according to the spec body and formData are exclusive!
        var parser =
          (parameters.some(spec => spec.in === 'formData') && urlencodedParser) || jsonParser;
        app[verb](expressifiedPath, parser, serverImpl[implementation]);
      } else {
        app[verb](expressifiedPath, serverImpl[implementation]);
      }
    });
  });

  // I don't need this anymore.
  api = null;
  if (configureApp) {
    configureApp().catch(e => {
      logger.error('Fatal error: ', e);
      // If there's an error while (re)configuring, we should just exit.
      throw new Error('FATAL: Error configuring app!');
    });
    app.reloadConfig = configureApp;
  }
  return app;
};
