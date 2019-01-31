/* globals Firebase */

!(function (exports) {
  'use strict';

  var archives = null;
  var listeners = {};

  function init(aUrl, aToken, pubnubSubKey, pubnubPubKey) {
    var self = this;
    return LazyLoader.dependencyLoad([
      'https://cdn.firebase.com/js/client/2.3.1/firebase.js',
      'https://cdn.pubnub.com/sdk/javascript/pubnub.4.21.7.js'
    ]).then(function () {
      return new Promise(function (resolve) {
        // url points to the session root
        var sessionRef = new Firebase(aUrl);
        sessionRef.authWithCustomToken(aToken, function () {
          var archivesRef = sessionRef.child('archives');
          /*archivesRef.on('value', function updateArchiveHistory(snapshot) {
            var handlers = listeners.value;
            archives = snapshot.val();
            console.log('Message FBM1: ' + JSON.stringify(archives));
            var archiveValues = Promise.resolve(archives || {});
            handlers && handlers.forEach(function (aHandler) {
              archiveValues.then(aHandler.method.bind(aHandler.context));
            });
          }, function onCancel(err) {
            // We should get called here only if we lose permission...
            // which should only happen if the branch is erased.
            var handlers = listeners.value;
            console.error('Lost connection to Firebase. Reason: ', err); // eslint-disable-line no-console
            var archiveValues = Promise.resolve({});
            handlers && handlers.forEach(function (aHandler) {
              archiveValues.then(aHandler.method.bind(aHandler.context));
            });
          });*/
          var pubnub = new PubNub({
            publishKey: pubnubPubKey,
            subscribeKey: pubnubSubKey
          });

          pubnub.addListener({
            message: function(message) {
              //console.log('Message FBM: ' + JSON.stringify(message.message.archives));
              var handlers = listeners.value;
              archives = message.message.archives;
              var archiveValues = Promise.resolve(archives || {});
              handlers && handlers.forEach(function (aHandler) {
                archiveValues.then(aHandler.method.bind(aHandler.context));
              });
            }
          });

          pubnub.subscribe({
            channels: ['archives_channel'],
          });

          sessionRef.child('connections').push(new Date().getTime()).onDisconnect().remove();
          pubnub.publish(
            {
              message: {
                connection: new Date().getTime()
              },
              channel: 'connections_channel',
              sendByPost: false,
              storeInHistory: false
            },
            function(status, response) {
              if(status.error) {
                console.log(status);
              } else {
                console.log("message Published w/ timetoken", response.timetoken);
              }
            }
          );
          resolve(self);
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
