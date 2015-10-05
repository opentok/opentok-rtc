!function(exports) {

  'use strict';
  // TODO - Move to a configuration file or someplace like that
  var DEBUG_LEVEL = 7;

  // TODO - to change debug function for instanciable one
  var fcDebug = function(level, msg) {
    (level & DEBUG_LEVEL) && console.log(msg);
  };

  var logLevels = {
    error: 1,
    warning: 2,
    log: 4
  };

  var getCurrentTime = function() {
    var now = new Date();
    var min = now.getMinutes().toString();
    var hours = now.getHours().toString();
    var ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return hours + ':' + min + ' ' + ampm;
  };

  var inspectObject = function(obj){
    var str = '';
    Object.keys(obj).forEach(function(elto) {
      str += '\n' + elto + ':' + JSON.stringify(obj[elto]);
    });
    return str;
  };


  var Utils = {
    debug: {
      log: fcDebug.bind(undefined, logLevels.log),
      warning: fcDebug.bind(undefined, logLevels.warning),
      error: fcDebug.bind(undefined, logLevels.error)
    },
    getCurrentTime: getCurrentTime,
    inspectObject: inspectObject
  };

  exports.Utils = Utils;

}(this);
