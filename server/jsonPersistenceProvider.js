// Implement a JSON file backed persistence provider.

// Interface:
//   - Constructor(filePath, options): File path is the path of the json that will hold the
//     configuration. The file will be created if it doesn't exist.
//   - on: Emit the 'ready' event when the file has been loaded
//   - pipeline: Creates an object that has a similar interface to the ioredis.pipeline.
//     In particular, it offers a chainable get method, and a exec()
//   - get(key) => Promise.
//   - set(key, value) => Promise. Set modifies the underlying file
// The file is checked for changes in the background (with a watcher) and it's automatically
// reloaded. The file is written immediately when there's a set operation.
'use strict';

module.exports = function(aFilepath, aOptions) {
  var internalState;

  var Utils = require('./shared/utils');
  var Logger = Utils.MultiLevelLogger;
  var logger = new Logger('JsonPersistenceProvider', aOptions.logLevel || 0);

  var fs = require('fs');
  var readFile = Utils.promisify(fs.readFile);
  var writeFile = Utils.promisify(fs.writeFile);
  var isReady;
  var processingWrite = false;

  function Pipeline() {
    var requestedKeys = [];

    this.get = aKey => {
      requestedKeys.push(aKey);
      return this;
    };

    this.exec = () => isReady.then(() => requestedKeys.map(key => [null, internalState[key]]));
  }

  function updateInternalState() {
    // If we're writing a change to the file, don't reload it
    if (processingWrite) {
      processingWrite = false;
      return;
    }
    isReady = readFile(aFilepath).then(aFileState => {
      logger.trace('Read file:', aFilepath);
      internalState = JSON.parse(aFileState);
      if (typeof internalState !== 'object') {
        throw new Error('The file content was a valid JSON but not an object!');
      }
    }).catch((e) => {
      logger.error('Error reading file:', aFilepath, e,
                 ' Initializing state to empty and creating the file');
      internalState = {};
      return writeFile(aFilepath, JSON.stringify(internalState));
    }).then(() => {
      logger.trace('(', aFilepath, ') State set to:', internalState);
    });
  }

  updateInternalState();

  isReady.
    then(() => fs.watch(aFilepath, updateInternalState));

  return {
    on: function(aSignal, aCB) {
      if (aSignal === 'ready') {
        isReady.then(aCB);
      }
    },
    pipeline: function() {
      return new Pipeline();
    },
    get: function(aKey) {
      return isReady.then(() => internalState[aKey]);
    },


// TO-DO TO-DO: Currently when we write the file the watcher fires up and we read it again. That's suboptimal Fix it.
    set: function(aKey, aValue) {
      return isReady.then(() => {
        internalState[aKey] = aValue;
        processingWrite = true;
        return writeFile(aFilepath, JSON.stringify(internalState)).then(() => {
          return aValue;
        });
      });
    }
  };
};
