/* global Utils */

!(function(exports) {
  'use strict';

  var archives = null;
  var listeners = {};

  var debug = new Utils.MultiLevelLogger('firebase.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);

  function init(fbConfig) {
    var self = this;
    return LazyLoader.dependencyLoad([
      'https://www.gstatic.com/firebasejs/4.1.2/firebase.js'
    ]).then(function() {
      return new Promise(function(resolve, reject) {
        firebase.initializeApp({ apiKey: fbConfig.apiKey, databaseURL: fbConfig.databaseURL });
        firebase.auth().signInWithCustomToken(fbConfig.token)
          .then(function() {
            // url points to the session root
            var sessionRef = firebase.database().ref(fbConfig.databaseRef);
            var archivesRef = sessionRef.child('archives');

            function updateArchiveHistory(snapshot) {
              var handlers = listeners.value;
              archives = snapshot.val();
              var archiveValues = Promise.resolve(archives || {});
              handlers && handlers.forEach(function(aHandler) {
                archiveValues.then(aHandler.method.bind(aHandler.context));
              });
            }

            function onCancel(err) {
              // We should get called here only if we lose permission...
              // which should only happen if the branch is erased.
              var handlers = listeners.value;
              debug.error('Lost connection to Firebase. Reason: ', err); // eslint-disable-line no-console
              var archiveValues = Promise.resolve({});
              handlers && handlers.forEach(function(aHandler) {
                archiveValues.then(aHandler.method.bind(aHandler.context));
              });
            }

            archivesRef.on('value', updateArchiveHistory, onCancel);

            sessionRef.child('connections').push(new Date().getTime()).onDisconnect().remove();

            debug.log('Firebase connection successful');

            resolve(self);
          })
          .catch(function(e) {
            debug.error('Firebase auth failed', e);
            reject('Firebase auth failed', e);
          });
      });
    });
  }

  function addEventListener(type, aHandler) {
    var context;
    if (!(type in listeners)) {
      listeners[type] = [];
    }

    var hd = aHandler;
    if (typeof hd === 'object') {
      context = hd;
      hd = hd.handleEvent;
    }

    if (hd) {
      listeners[type].push({
        method: hd,
        context: context
      });
    }
  }

  function removeEventListener(type, aHandler) {
    if (!(type in listeners)) {
      return false;
    }
    var handlers = listeners[type];
    if (handlers) {
      for (var i = 0, l = handlers.length; i < l; i++) {
        var thisHandler = aHandler;
        if (typeof thisHandler === 'object') {
          thisHandler = aHandler.handleEvent;
        }
        if (handlers[i].method === thisHandler) {
          handlers.splice(i, 1);
          return true;
        }
      }
    }
    return false;
  }

  var FirebaseModel = {
    addEventListener: addEventListener,
    removeEventListener: removeEventListener,
    init: init,
    get archives() {
      return archives;
    }
  };

  exports.FirebaseModel = FirebaseModel;
}(this));
