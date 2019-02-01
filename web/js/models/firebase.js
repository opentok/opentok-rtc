/* globals Firebase */

!(function (exports) {
  'use strict';

  var archives = null;
  var listeners = {};

  function init(pubnubSubKey, pubnubPubKey, sessionId) {
    var self = this;
    return LazyLoader.dependencyLoad([
      'https://cdn.pubnub.com/sdk/javascript/pubnub.4.21.7.js'
    ]).then(function () {
      return new Promise(function (resolve) {
        var pubnub = new PubNub({
          publishKey: pubnubPubKey,
          subscribeKey: pubnubSubKey
        });

        pubnub.addListener({
          message: function(message) {
            var handlers = listeners.value;
            archives = message.message.archives;
            var archiveValues = Promise.resolve(archives || {});
            handlers && handlers.forEach(function (aHandler) {
              archiveValues.then(aHandler.method.bind(aHandler.context));
            });
          }
        });

        pubnub.subscribe({
          channels: [sessionId],
        });

        pubnub.publish(
          {
            message: {
              session: sessionId
            },
            channel: 'connections_channel',
            sendByPost: false,
            storeInHistory: false
          }
        );
        resolve(self);
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
