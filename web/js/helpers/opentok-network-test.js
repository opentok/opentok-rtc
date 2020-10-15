/* OpenTok network test - see https://github.com/opentok/opentok-network-test */

!(global => {
  function OTNetworkTest(options) {

    const TEST_TIMEOUT_MS = 15000; // 15 seconds

    const subscriberEl = document.createElement('div');
    const publisherEl = document.createElement('div');

    let session;
    const publisher = OT.initPublisher(publisherEl, options);
    let subscriber;
    let bandwidthCalculator;
    let getStatsIntervalId;
    let testTimeoutId;
    let currentStats;

    const testStreamingCapability = (subscriber, callback) => {
      performQualityTest({subscriber, timeout: TEST_TIMEOUT_MS}, (error, results) => {
        // If we tried to set video constraints, but no video data was found
        if (!results.video) {
          const audioSupported = results.audio.bitsPerSecond > 25000 &&
              results.audio.packetLossRatio < 0.05;

          if (audioSupported) {
            return callback(false, {
              text: 'You can\'t send video because no camera was found, ' +
                'but your bandwidth can support an audio-only stream.',
              classification: 'precall-warning',
              audio: results.audio,
              video: null,
              audioOnly: true
            });
          }

          return callback(false, {
              text: 'You can\'t send video because no camera was found, ' +
                'and your bandwidth is too low for an audio-only stream.',
            classification: 'precall-error',
            audio: results.audio,
            video: null
          });
        }

        const audioVideoSupported = results.video.bitsPerSecond > 250000 &&
          results.video.packetLossRatio < 0.03 &&
          results.audio.bitsPerSecond > 25000 &&
          results.audio.packetLossRatio < 0.05;

        if (audioVideoSupported) {
          return callback(false, {
            text: 'You\'re all set!',
            classification: 'precall-tick',
            audio: results.audio,
            video: results.video
          });
        }

        if (results.audio.packetLossRatio < 0.05) {
          return callback(false, {
            text: 'Your bandwidth can support audio only.',
            classification: 'precall-warning',
            audio: results.audio,
            video: results.video,
            audioOnly: true
          });
        }

        // try audio only to see if it reduces the packet loss
        publisher.publishVideo(false);

        performQualityTest({subscriber, timeout: 5000}, (error, results) => {
          const audioSupported = results.audio.bitsPerSecond > 25000 &&
              results.audio.packetLossRatio < 0.05;

          if (audioSupported) {
            return callback(false, {
              text: 'Your bandwidth can support audio only.',
              classification: 'precall-warning',
              audio: results.audio,
              video: results.video,
              audioOnly: true
            });
          }

          return callback(false, {
            text: 'Your bandwidth is too low for video or audio.',
            classification: 'precall-error',
            audio: results.audio,
            video: results.video
          });
        });
      });
    };

    this.startNetworkTest = callback => {
      // You cannot use the network test in IE. IE cannot subscribe to its own stream.
      if (Utils.isIE() || !enablePrecallTest) {
        return;
      }
      publisher.publishVideo(true);
      const callbacks = {
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

        cleanup() {
          session.disconnect();
        },

        onSubscribe: function onSubscribe(error, subscriber) {
          if (error) {
            console.error('Could not subscribe to video.', error);
            return;
          }

          testStreamingCapability(subscriber, (error, result) => {
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
        error => {
          if (error) {
            return;
          }
        }
      );

      callbacks.onInitPublisher();

      // This publisher uses the default resolution (640x480 pixels) and frame rate (30fps).
      // For other resoultions you may need to adjust the bandwidth conditions in
      // testStreamingCapability().
      publisher.on('streamDestroyed', event => {
        event.preventDefault(); // Do not remove the preview publisher from the page.
      });

      session = OT.initSession(options.apiKey, options.sessionId);
      session.connect(options.token, callbacks.onConnect);
    };
    
    this.stopTest = () => {
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
      return arr.map(value => {
        return value[propertName];
      });
    }

    function sum(arr, propertyName) {
      if (typeof propertyName !== 'undefined') {
        arr = pluck(arr, propertyName);
      }

      return arr.reduce((previous, current) => {
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
      const stats = {};
      const activeMediaTypes = Object.keys(statsBuffer[0] || {})
        .filter(key => {
          return key !== 'timestamp';
        });

      activeMediaTypes.forEach(type => {
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
      const times = pluck(samples, 'timestamp');
      return (max(times) - min(times)) / 1000;
    }

    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function(fn, scope) {
        for (let i = 0, len = this.length; i < len; ++i) {
          fn.call(scope, this[i], i, this);
        }
      };
    }

    function compositeOfCallbacks(obj, fns, callback) {
      const results = {};
      let hasError = false;

      const checkDone = function checkDone() {
        if (Object.keys(results).length === fns.length) {
          callback(hasError, results);
          callback = () => {};
        }
      };

      fns.forEach(key => {
        const originalCallback = obj[key];

        obj[key] = function(error) {
          results[key] = {
            error,
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
        start(reportFunction) {
          let statsBuffer = [];
          const last = {
            audio: {},
            video: {}
          };

          getStatsIntervalId = window.setInterval(() => {
            config.subscriber.getStats((error, stats) => {
              const activeMediaTypes = Object.keys(stats)
              .filter(key => {
                return key !== 'timestamp';
              });
              const snapshot = {};
              const nowMs = new Date().getTime();
              let sampleWindowSize;

              activeMediaTypes.forEach(type => {
                snapshot[type] = Object.keys(stats[type]).reduce((result, key) => {
                  result[key] = stats[type][key] - (last[type][key] || 0);
                  last[type][key] = stats[type][key];
                  return result;
                }, {});
              });

              // get a snapshot of now, and keep the last values for next round
              snapshot.timestamp = stats.timestamp;

              statsBuffer.push(snapshot);
              statsBuffer = statsBuffer.filter(value => {
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

        stop() {
          window.clearInterval(getStatsIntervalId);
          window.clearTimeout(testTimeoutId);
        }
      };
    }

    var performQualityTest = (config, callback) => {
      const startMs = new Date().getTime();

      bandwidthCalculator = bandwidthCalculatorObj({
        subscriber: config.subscriber
      });

      const cleanupAndReport = () => {
        currentStats.elapsedTimeMs = new Date().getTime() - startMs;

        bandwidthCalculator.stop();
        callback(undefined, currentStats);
        callback = () => {};
      };

      testTimeoutId = window.setTimeout(cleanupAndReport, config.timeout);

      bandwidthCalculator.start(stats => {
        currentStats = stats;
      });
    }
  }

  global.OTNetworkTest = OTNetworkTest;
})(this);
