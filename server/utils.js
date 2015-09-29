var Utils = {};

'use strict';

module.exports = Utils;

// Simple logger that allow multiple level logs. The configured level
// must be a bitmask of the desired enabled levels.
// Usage:
// var logger = new Logger('Logger Name', 4); // Enable only error
// logger.error('Test error'); // Logs an error
// logger.log('Test log'); // does nothing
// logger.enableLevel(1); // enable the log level
// logger.log('Test log'); Prints the log
// logger.disableLevel(1); Disable the log level (but leaves the rest)
Utils.MultiLevelLogger = function(aName, aEnabledLevels) {

  var enabledLevels = aEnabledLevels;

  // The first argument is the level, the rest what we want to log
  function trace() {
    var args = Array.prototype.slice.call(arguments);
    var traceLevel = args.shift();
    if (traceLevel.level & enabledLevels) {
      args.unshift('[' + traceLevel.name + '] ' + new Date().toString() + ' - ' + aName + ":");
      console.log.apply(console, args);
    }
  }

  var returnedLogger = {
    enableLevel: function(aNewLevel) {
      enabledLevels = enabledLevels | aNewLevel;
    },
    disableLevel: function(aNewLevel) {
      enabledLevels ^= (enabledLevels & aNewLevel);
    },
    set logLevel(aEnabledLevels) {
      enabledLevels = aEnabledLevels;
    },
    get logLevel() {
      return enabledLevels;
    }
  };

  var defLevels = Utils.MultiLevelLogger.DEFAULT_LEVELS;
  Object.keys(defLevels).forEach(function(aLevelName) {
    returnedLogger[aLevelName] =
      trace.bind(undefined, {level: defLevels[aLevelName], name: aLevelName.toUpperCase()});
  });

  return returnedLogger;
}

// Some preconfigured levels...
Utils.MultiLevelLogger.DEFAULT_LEVELS = {
  never: 0,
  log: 1,
  warn: 2,
  error: 4,
  all: 255
};


var logger =
  new Utils.MultiLevelLogger('Utils', Utils.MultiLevelLogger.DEFAULT_LEVELS.never);

Utils.promisify = function (fn) {
  return function() {
    logger.log('promisify: Creating function envelope!');
    var args = Array.prototype.slice.call(arguments);
    return new Promise((resolve, reject) => {
      logger.log('promisify: Executing promisified function!');

      args.push((err, res) => {
        logger.log('promisify: Resolving!');
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });

      var res = fn.apply(this, args);
      if (res && (
          typeof res === 'object' ||
          typeof res === 'function'
          ) && typeof res.then === 'function') {
        resolve(res);
      }
    });
  };
};

