!function(global) {

  var Utils = {};

  'use strict';

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
        args.unshift('[' + traceLevel.name + '] ' + new Date().toISOString() + ' - ' + aName + ':');
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
        trace.bind(undefined, { level: defLevels[aLevelName], name: aLevelName.toUpperCase() });
    });

    return returnedLogger;
  };

  // Some preconfigured levels...
  Utils.MultiLevelLogger.DEFAULT_LEVELS = {
    never: 0,
    log: 1,
    warn: 2,
    error: 4,
    all: 65535
  };


  var logger =
    new Utils.MultiLevelLogger('Utils', Utils.MultiLevelLogger.DEFAULT_LEVELS.never);

  Utils.promisify = function (fn) {
    return function() {
      logger.log('promisify: Creating function envelope!');
      var args = Array.prototype.slice.call(arguments);
      return new Promise(function(resolve, reject) {
        logger.log('promisify: Executing promisified function!');

        args.push(function(err, res) {
          logger.log('promisify: Resolving!', 'Err: ', err, 'Res: ', res);
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });

        var res = fn.apply(this, args);
        if (res && (typeof res === 'object' || typeof res === 'function') &&
            typeof res.then === 'function') {
          resolve(res);
        }
      }.bind(this));
    };
  };

  // Returns a new object (of the first argument class) if the same object
  // hasn't been constructed already, or a cached object if it's been cached already
  // Note that this implementation *requires* WeapMap, so it won't work on IE9.
  // If at some point this is needed on IE it will have to be implemented using x-linked arrays.
  var _objectCache = typeof WeakMap !== undefined && new WeakMap();
  Utils.CachifiedObject = function(aCachedObject) {
    // The actual argument list includes not only the cached object but also the parameters...
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    var cachedObject = _objectCache.get(aCachedObject) || {};
    var oldArgs = cachedObject.args || [];

    // We need to get a new instance if
    //  - There wasn't an old instance already OR
    //  - The number of arguments has changed OR
    //  - The arguments have changed
    var getNewInstance =
      (!cachedObject.instance) ||
      (args.length !== oldArgs.length) ||
      !args.every(function(value, index) { return value === oldArgs[index]});

    if (getNewInstance) {
      cachedObject.instance = new (Function.prototype.bind.apply(aCachedObject, arguments));
      cachedObject.args = args;
      _objectCache.set(aCachedObject, cachedObject);
    }
    return cachedObject.instance;
  };

  // Returns the existing cached object
  Utils.CachifiedObject.getCached = function(aCachedObject) {
    var cachedObject = _objectCache.get(aCachedObject);
    return cachedObject && cachedObject.instance;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
  } else {
    // Just replacing global.utils might not be safe... let's just expand it...
    global.Utils = global.Utils || {};
    Object.keys(Utils).forEach(function (utilComponent) {
      global.Utils[utilComponent] = Utils[utilComponent];
    });
  }

}(this);
