// This module implements all the persistence management that the server has do keep.
// It can be initialized with an object that specifies a set of keys (with default values)
// that have to be cached. Usually that can be used to retrieve the server configuration.
// The object created will be a promise instance that will be resolved when the requested
// initial set of data is available. The fulfilled value of the promise will hold both
// the requested cached data and the methods needed to process the rest of the persistent
// data.

// We'll use whatever is defined in aModules.PersistenceProvider (or ioredis by default)
// to store the persistent information. The PersistenceProvider must implement a subset
// of the ioredis interface. Specifically:
//  - Constructor
//  - It should emit the 'ready' event (set with provider.on('ready', callback)
//  - get(aKey) => Promise
//  - set(aKey) => Promise
//  - pipeline()
//  -   - pipepine.get
//  -   - pipeline.exec
function ServerPersistence(aCachedEntries, aConnectParameters, aLogLevel, aModules) {
  'use strict';

  var PersistenceProvider = aModules && aModules.PersistenceProvider || require('ioredis');

  var Utils = require('./shared/utils');
  var Logger = Utils.MultiLevelLogger;
  var logger = new Logger('ServerPersistence', aLogLevel);
  logger.trace('Connecting to:', aConnectParameters, 'Provider:',
             aModules.PersistenceProvider || 'Redis');

  const CONNECT_TIMEOUT = 5000;

  function connectToPersistenceProvider() {
    var storage = new PersistenceProvider(aConnectParameters,
                                          { connectTimeout: CONNECT_TIMEOUT, logLevel: aLogLevel });
    var watchdog = setInterval(function() {
      logger.warn('Timeout while connecting to the Persistence Provider! Is Redis running?');
    }, CONNECT_TIMEOUT);
    storage.on('ready', function() {
      logger.trace('Successfully connected to Redis and DB is ready.');
      clearInterval(watchdog);
    });
    return storage;
  }

  function getPipelineForArrayOps(aProviderInst, aKeyArray, aOp) {
    var pipeline = aProviderInst.pipeline();
    for (var i = 0, l = aKeyArray.length; i < l ; i++) {
      pipeline = pipeline[aOp](aKeyArray[i]);
    }
    return pipeline;
  }

  function loadCache(aProvider) {
    var pipeline = getPipelineForArrayOps(aProvider, aCachedEntries.map(elem => elem.key), 'get');
    return pipeline.exec().then(results => {
      var cachedItems = {};
      // Results should be a n row array of two row arrays...
      // Just so we don't have to C&P a bunch of validations...
      for (var i = 0, l = aCachedEntries.length; i < l; i++) {
        var keyValue = results[i][1] || aCachedEntries[i].defaultValue;
        // Since we set null as default for mandatory items...
        if (keyValue === null) {
          var message = 'Missing required redis key: ' + aCachedEntries[i].key +
            '. Please check the installation instructions';
          logger.error(message);
          throw new Error(message);
        }
        cachedItems[aCachedEntries[i].key] = keyValue;
        logger.trace('cachedItems[', aCachedEntries[i].key, '] =', keyValue);
      }
      return cachedItems;
    });
  }

  var provider = connectToPersistenceProvider();
  return {
    cached: null,
    getKey: function(aKeyName, aAsObject) {
      if (!aKeyName) {
        return Promise.resolve(null);
      }
      if (this.cached && this.cached[aKeyName]) {
        return Promise.resolve(this.cached[aKeyName]);
      }

      return provider.get(aKeyName).then(aValue => {
        try {
          return aAsObject && aValue && JSON.parse(aValue) || aValue;
        } catch(e) {
          return aValue;
        }
      });
    },
    setKey: function(aKeyName, aKeyValue) {
      return provider.set(aKeyName, aKeyValue);
    },
    setKeyEx: function(aExpiration, aKeyName, aKeyValue) {
      return provider.setex(aKeyName, aExpiration, aKeyValue);
    },
    delKey: function(aKeyName) {
      return provider.del(aKeyName);
    },
    updateCache() {
      return loadCache(provider).then(cachedItems => {
        this.cached = cachedItems;
        return cachedItems;
      });
    }
  };

}

module.exports = ServerPersistence;
