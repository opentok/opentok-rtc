'use strict';

var sighup = {
  handler: null
};

// Capture signals and optionally daemonize and change username
function setupProcess(aLogger, aDaemonize, aLogFile) {
  aLogger.log('Setting up process. Run as a daemon:', aDaemonize, 'Logfile:', aLogFile);

  // Since we might need to open some files, and that's an asynchronous operation,
  // we will return a promise here that will never resolve on the parent (process will die instead)
  // and will resolve on the child
  return new Promise((resolve, reject) => {
    if (!aDaemonize) {
      return resolve();
    }

    if (!aLogFile) {
      return resolve({ stdout: process.stdout, stderr: process.stderr });
    }

    var fs = require('fs');
    var outputStream = fs.createWriteStream(aLogFile);
    outputStream.on('open', function() {
      resolve({ stdout: outputStream, stderr: outputStream });
    });
    return null;
  }).then(daemonOpts => {
    // No need to continue, let's make ourselves a daemon.
    if (daemonOpts) {
      require('daemon')(daemonOpts);
    }

    var signals = [
      'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
      'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGALRM', 'SIGTERM'
    ];

    process.on('uncaughtException', function(err) {
      aLogger.error('Got an uncaught exception:', err, err.stack);
    });

    process.on('unhandledRejection', function(aReason, aPromise) {
      aLogger.log('Unhandled Rejection:', aReason);
      if (aReason.message && aReason.message.startsWith('FATAL:')) {
        aLogger.error('Got a fatal error! Exiting!');
        process.exit(1);
      }
    });

    process.on('SIGHUP', function() {
      if (sighup.handler && sighup.handler instanceof Function) {
        aLogger.log('Got SIGHUP. Reloading config!');
        sighup.handler();
      } else {
        aLogger.log('Got SIGHUP. Ignoring!');
      }
    });

    // Sometime we get a SIGPIPE for some unknown reason. Just log and ignore it.
    process.on('SIGPIPE', function() {
      aLogger.log('Got SIGPIPE. Ignoring');
    });

    process.on('exit', function() {
      aLogger.log('Node process exiting!');
    });

    signals.forEach(aSignalName => {
      aLogger.log('Setting handler', aSignalName);
      process.on(aSignalName, function(aSignal) {
        aLogger.log(aSignal, 'captured! Exiting now.');
        process.exit(1);
      }.bind(undefined, aSignalName));
    });
  });

}

module.exports = setupProcess;
module.exports.SIGHUP = sighup;
