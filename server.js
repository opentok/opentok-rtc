// This app serves some static content from a static path and serves a REST API that's
// defined on the api.json file (derived from a swagger 2.0 yml file)
// Usage:
// node server -h

'use strict';
var currentUid = process.getuid();

function parseCommandLine() {
  const DEFAULTS = {
    daemon: false,
    user: currentUid,
    serverPort: 8123,
    staticPath: './web',
    serverLibs: './server/',
    certDir: 'serverCerts',
    secure: false
  };

  // node-getopt oneline example.
  var commandOpts =
    require('node-getopt').create([
      ['h', 'help', 'Displays this help'],
      ['d', 'daemon', 'Starts as a daemon'],
      ['u', 'user=ARG', 'UID (name or number) to fork to after binding the port'],
      ['p', 'serverPort=ARG', 'Server listening port'],
      ['s', 'staticPath=ARG', 'Directory that holds the static files'],
      ['C', 'certDir=ARG', 'Directory that holds the cert.pem and key.pem files'],
      ['S', 'secure', 'Starts as a secure server (HTTPS)']
    ]).
    bindHelp().
    parseSystem();
  var options = {};
  Object.keys(DEFAULTS).forEach(option => {
    options[option] = commandOpts.options[option] || DEFAULTS[option];
  });

  // We will only try to change the uid if it's different from the current one. And we'll refuse
  // if we're not root...
  // We fail on this as soon as possible. No need initializing the rest only to die.
  if ((options.user !== currentUid) && (currentUid !== 0)) {
    console.error('Cannot set -u if not running as root!');
    process.exit(1);
  }
  return options;
}

// Capture signals and optionally daemonize and change username
function setupProcess(aLogger, aDaemonize) {
  logger.log('Setting up process. Run as a daemon:', aDaemonize);

  // No need to continue, let's make ourselves a daemon.
  // Note that we should ensure that we're not going to use stdout and stderr here...
  if (aDaemonize) {
    var daemonOpts = {
      stdout: process.stdout,
      stderr: process.stderr
    };
    require('daemon')(daemonOpts);
  }

  var signals = [
    'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
    'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGPIPE', 'SIGALRM', 'SIGTERM'
  ];

  process.on('uncaughtException', function(err) {
    aLogger.error('Exiting because of an uncaught exception:', err, err.stack);
  });

  process.on('SIGHUP', function() {
    // To-do: probably should reload the configuration here
    aLogger.log('Got SIGHUP. Ignoring!');
  });

  process.on('exit', function() {
    aLogger.log('Node process exiting!');
  });

  signals.forEach(aSignalName => {
    logger.log('Setting handler', aSignalName);
    process.on(aSignalName, function(aSignal) {
      aLogger.log(aSignal, 'captured! Exiting now.');
      process.exit(1);
    }.bind(undefined, aSignalName));
  });

}

// At this moment reads the cert and key as serverKey and serverCert, without password, from
// aCertDir.
function getServerConfig(aCertDir) {
  var certFileRead = readFile(aCertDir + '/serverCert.pem');
  var keyFileRead = readFile(aCertDir + '/serverKey.pem');
  return Promise.all([certFileRead, keyFileRead]).
    then(files => [{ cert: files[0], key: files[1] }]);
}

var options = parseCommandLine();
var Utils = require(options.serverLibs + '/shared/utils');
var fs = require('fs');
var readFile = Utils.promisify(fs.readFile);


var Logger = Utils.MultiLevelLogger;
var logLevel =  Logger.DEFAULT_LEVELS.all;
var logger = new Logger('OpenTokRTC Main', logLevel);

var staticPath = options.staticPath;
var serverPort = options.serverPort;
var serverType;
var loadServerConfig;

setupProcess(logger, options.daemon);

if (options.secure) {
  serverType = require('https');
  loadServerConfig = getServerConfig(options.certDir);
} else {
  serverType = require('http');
  loadServerConfig = Promise.resolve([]);
}

// The API definition is on the api.json file...
Promise.all([loadServerConfig, readFile('./api.json')]).then(requisites => {
  var serverParams = requisites[0];
  var apiDef = requisites[1];
  logger.log('api.json file read');

  var app = require('./server/app')(staticPath, apiDef, logLevel);

  logger.log('Starting', options.secure ? 'secure' : '', 'server at', serverPort, ', static path: ',
             staticPath);

  serverParams.push(app);
  serverType.createServer.apply(serverType, serverParams).
    listen(serverPort);

  // We will only try to change the uid if it's different from the current one.
  if (options.user !== currentUid) {
    process.setuid(options.user); // And we'll hope for the best...
  }


}).catch(error => {
  logger.error('Error starting server: ', error, error.stack);
});

