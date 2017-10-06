/* OpenTok network test - see https://github.com/opentok/opentok-network-test */

!function(global) {
  'use strict';

  function OTNetworkTest(options) {

    var TEST_TIMEOUT_MS = 15000; // 15 seconds

    var subscriberEl = document.createElement('div');
    var publisherEl = document.createElement('div');

    var session;
    var publisher = OT.initPublisher(publisherEl, options);
    var subscriber;
    var bandwidthCalculator;
    var intervalId;
    var currentStats;

    var testStreamingCapability = function(subscriber, callback) {
      performQualityTest({subscriber: subscriber, timeout: TEST_TIMEOUT_MS}, function(error, results) {
        // If we tried to set video constraints, but no video data was found
        if (!results.video) {
          var audioSupported = results.audio.bitsPerSecond > 25000 &&
              results.audio.packetLossRatio < 0.05;

          if (audioSupported) {
            return callback(false, {
              text: 'You can\'t send video because no camera was found, ' +
                'but your bandwidth can support an audio-only stream.',
              icon: 'precall-warning',
              audio: results.audio,
              video: null,
              audioOnly: true
            });
          }

          return callback(false, {
              text: 'You can\'t send video because no camera was found, ' +
                'and your bandwidth is too low for an audio-only stream.',
            icon: 'precall-warning',
            audio: results.audio,
            video: null
          });
        }

        var audioVideoSupported = results.video.bitsPerSecond > 250000 &&
          results.video.packetLossRatio < 0.03 &&
          results.audio.bitsPerSecond > 25000 &&
          results.audio.packetLossRatio < 0.05;

        if (audioVideoSupported) {
          return callback(false, {
            text: 'You\'re all set!',
            icon: 'precall-tick',
            audio: results.audio,
            video: results.video
          });
        }

        if (results.audio.packetLossRatio < 0.05) {
          return callback(false, {
            text: 'Your bandwidth can support audio only.',
            icon: 'precall-warning',
            audio: results.audio,
            video: results.video,
            audioOnly: true
          });
        }

        // try audio only to see if it reduces the packet loss
        publisher.publishVideo(false);

        performQualityTest({subscriber: subscriber, timeout: 5000}, function(error, results) {
          var audioSupported = results.audio.bitsPerSecond > 25000 &&
              results.audio.packetLossRatio < 0.05;

          if (audioSupported) {
            return callback(false, {
              text: 'Your bandwidth can support audio only.',
              icon: 'precall-warning',
              audio: results.audio,
              video: results.video,
              audioOnly: true
            });
          }

          return callback(false, {
            text: 'Your bandwidth is too low for video or audio.',
            icon: 'precall-error',
            audio: results.audio,
            video: results.video
          });
        });
      });
    };

    this.startNetworkTest = function(callback) {
      publisher.publishVideo(true);
      var callbacks = {
        onInitPublisher: function onInitPublisher(error) {
          if (error) {
            console.error('Could not acquire your camera and microphone.', error);
            return;
          }

        },
        
        onPublish: function onPublish(error) {
          if (error) {
            // handle publishing errors here
            console.error('Could not publish video.', error);
            return;
          }

          subscriber = session.subscribe(
            publisher.stream,
            subscriberEl,
            {
              audioVolume: 0,
              testNetwork: true
            },
            callbacks.onSubscribe
          );
        },

        cleanup: function() {
          session.disconnect();
        },

        onSubscribe: function onSubscribe(error, subscriber) {
          if (error) {
            console.error('Could not subscribe to video.', error);
            return;
          }

          testStreamingCapability(subscriber, function(error, result) {
            callback(error, result);
            callbacks.cleanup();
          });
        },

        onConnect: function onConnect(error) {
          if (error) {
            console.error('Could not connect to OpenTok.', error);
          }
          session.publish(publisher, callbacks.onPublish);
        }
      };

      compositeOfCallbacks(
        callbacks,
        ['onInitPublisher', 'onConnect'],
        function(error) {
          if (error) {
            return;
          }
        }
      );

      var container = document.createElement('div');
      container.className = 'container';

      container.appendChild(subscriberEl);
      document.body.appendChild(container);

      callbacks.onInitPublisher();

      // This publisher uses the default resolution (640x480 pixels) and frame rate (30fps).
      // For other resoultions you may need to adjust the bandwidth conditions in
      // testStreamingCapability().
      publisher.on('streamDestroyed', function(event) {
        event.preventDefault(); // Do not remove the preview publisher from the page.
      });

      session = OT.initSession(options.apiKey, options.sessionId);
      session.connect(options.token, callbacks.onConnect);
    };
    
    this.stopTest = function() {
      bandwidthCalculator && bandwidthCalculator.stop();
      try {
        session.unpublish(publisher);
        session.disconnect();
      } catch(error) {
        // Probably not connected yet.
      }
      publisher.destroy();
    }

    // Helpers

    function pluck(arr, propertName) {
      return arr.map(function(value) {
        return value[propertName];
      });
    }

    function sum(arr, propertyName) {
      if (typeof propertyName !== 'undefined') {
        arr = pluck(arr, propertyName);
      }

      return arr.reduce(function(previous, current) {
        return previous + current;
      }, 0);
    }

    function max(arr) {
      return Math.max.apply(undefined, arr);
    }

    function min(arr) {
      return Math.min.apply(undefined, arr);
    }

    function calculatePerSecondStats(statsBuffer, seconds) {
      var stats = {};
      var activeMediaTypes = Object.keys(statsBuffer[0] || {})
        .filter(function(key) {
          return key !== 'timestamp';
        });

      activeMediaTypes.forEach(function(type) {
        stats[type] = {
          packetsPerSecond: sum(pluck(statsBuffer, type), 'packetsReceived') / seconds,
          bitsPerSecond: (sum(pluck(statsBuffer, type), 'bytesReceived') * 8) / seconds,
          packetsLostPerSecond: sum(pluck(statsBuffer, type), 'packetsLost') / seconds
        };
        stats[type].packetLossRatio = (
          stats[type].packetsLostPerSecond / stats[type].packetsPerSecond
        );
      });

      stats.windowSize = seconds;
      return stats;
    }

    function getSampleWindowSize(samples) {
      var times = pluck(samples, 'timestamp');
      return (max(times) - min(times)) / 1000;
    }

    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function(fn, scope) {
        for (var i = 0, len = this.length; i < len; ++i) {
          fn.call(scope, this[i], i, this);
        }
      };
    }

    function compositeOfCallbacks(obj, fns, callback) {
      var results = {};
      var hasError = false;

      var checkDone = function checkDone() {
        if (Object.keys(results).length === fns.length) {
          callback(hasError, results);
          callback = function() {};
        }
      };

      fns.forEach(function(key) {
        var originalCallback = obj[key];

        obj[key] = function(error) {
          results[key] = {
            error: error,
            args: Array.prototype.slice.call(arguments, 1)
          };

          if (error) {
            hasError = true;
          }

          originalCallback.apply(obj, arguments);
          checkDone();
        };
      });
    }

    function bandwidthCalculatorObj(config) {

      config.pollingInterval = config.pollingInterval || 500;
      config.windowSize = config.windowSize || 2000;
      config.subscriber = config.subscriber || undefined;

      return {
        start: function(reportFunction) {
          var statsBuffer = [];
          var last = {
            audio: {},
            video: {}
          };

          intervalId = window.setInterval(function() {
            config.subscriber.getStats(function(error, stats) {
              var activeMediaTypes = Object.keys(stats)
              .filter(function(key) {
                return key !== 'timestamp';
              });
              var snapshot = {};
              var nowMs = new Date().getTime();
              var sampleWindowSize;

              activeMediaTypes.forEach(function(type) {
                snapshot[type] = Object.keys(stats[type]).reduce(function(result, key) {
                  result[key] = stats[type][key] - (last[type][key] || 0);
                  last[type][key] = stats[type][key];
                  return result;
                }, {});
              });

              // get a snapshot of now, and keep the last values for next round
              snapshot.timestamp = stats.timestamp;

              statsBuffer.push(snapshot);
              statsBuffer = statsBuffer.filter(function(value) {
                return nowMs - value.timestamp < config.windowSize;
              });

              sampleWindowSize = getSampleWindowSize(statsBuffer);

              if (sampleWindowSize !== 0) {
                reportFunction(calculatePerSecondStats(
                  statsBuffer,
                  sampleWindowSize + (config.pollingInterval / 1000)
                ));
              }
            });
          }, config.pollingInterval);
        },

        stop: function() {
          window.clearInterval(intervalId);
        }
      };
    }

    var performQualityTest = function(config, callback) {
      var startMs = new Date().getTime();

      bandwidthCalculator = bandwidthCalculatorObj({
        subscriber: config.subscriber
      });

      var cleanupAndReport = function() {
        currentStats.elapsedTimeMs = new Date().getTime() - startMs;

        bandwidthCalculator.stop();
        callback(undefined, currentStats);
        callback = function() {};
      };

      window.setTimeout(cleanupAndReport, config.timeout);

      bandwidthCalculator.start(function(stats) {
        currentStats = stats;
      });
    }
  };

  global.OTNetworkTest = OTNetworkTest;

}(this);
