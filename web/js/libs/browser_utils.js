/* global window, safari, LazyLoader, Draggable */
!(function (exports) {
  'use strict';

  var getCurrentTime = function () {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  var inspectObject = function (obj) {
    var str = '';
    Object.keys(obj).forEach(function (elto) {
      str += '\n' + elto + ':' + JSON.stringify(obj[elto]);
    });
    return str;
  };

  var sendEvent = function (eventName, data, target) {
    data = data ? { detail: data } : {};
    var newEvt = new CustomEvent(eventName, data);
    (target || exports).dispatchEvent(newEvt);
  };

  var addHandlers = function (events) {
    Object.keys(events).forEach(function (evtName) {
      var event = events[evtName];
      (event.target || exports).addEventListener(event.name, event.handler);
    });
  };

  var addEventsHandlers = function (eventPreffixName, handlers, target) {
    eventPreffixName = eventPreffixName || '';
    Object.keys(handlers).forEach(function (eventName) {
      (target || exports).addEventListener(eventPreffixName + eventName, handlers[eventName]);
    });
  };

  var removeEventHandlers = function (eventPreffixName, handlers, target) {
    eventPreffixName = eventPreffixName || '';
    Object.keys(handlers).forEach(function (eventName) {
      (target || exports).removeEventListener(eventPreffixName + eventName, handlers[eventName]);
    });
  };

  var setTransform = function (style, transform) {
    /* eslint-disable no-multi-assign */
    style.MozTransform = style.webkitTransform = style.msTransform = style.transform = transform;
    /* eslint-enable no-multi-assign */
  };


  // Adds newValue to currValue and returns the new value:
  //  - if currValue is undefined, returns newValue
  //  - if currValue is an array, it makes currValue.push(newValue) and returns currValue
  //  - if currValue is not an array, creates a new one with that value, adds the new value
  //    and returns that
  function _addValue(currValue, newValue) {
    if (currValue === undefined) {
      return newValue;
    }
    if (!Array.isArray(currValue)) {
      currValue = [currValue];
    }
    currValue.push(newValue);
    return currValue;
  }

  // parses a URL search string. It returns an object that has a key the parameter name(s)
  // and as values either the value if the value is unique or an array of values if it exists
  // more than once on the search
  var parseSearch = function (aSearchStr) {
    aSearchStr = decodeStr(aSearchStr);
    return aSearchStr.slice(1).split('&')
      .map(function (aParam) { return aParam.split(/=(.+)?/); })
      .reduce(function (aObject, aCurrentValue) {
        var parName = aCurrentValue[0];
        aObject.params[parName] = _addValue(aObject.params[parName], aCurrentValue[1] || null);
        return aObject;
      },
      {
        params: {},
        getFirstValue: function (aParam) {
          return Array.isArray(this.params[aParam]) ? this.params[aParam][0] : this.params[aParam];
        }
      }
    );
  };

  // Aux function to generate a search str from an object with
  // key: value or key: [value1,value2] structure.
  function generateSearchStr(aObject) {
    return Object.keys(aObject)
      .reduce(function (aPrevious, aParam, aIndex) {
        var value = aObject[aParam];
        value = Array.isArray(value) ? value : [value];
        value.forEach(function (aSingleValue, aValueIndex) {
          (aIndex + aValueIndex) && aPrevious.push('&');
          aPrevious.push(aParam);
          aSingleValue && aPrevious.push('=', aSingleValue);
        });
        return aPrevious;
      }, ['?'])
      .join('');
  }

  function decodeStr(str) {
    return str ? window.decodeURIComponent(str) : str;
  }

  var setDisabled = function (element, disabled) {
    element.disabled = disabled;
    disabled ? element.setAttribute('disabled', 'disabled') :
               element.removeAttribute('disabled');
  };

  var formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  function toPrettyDuration(duration) {
    var time = [];

    // 0 hours -> Don't add digit
    var hours = Math.floor(duration / (60 * 60));
    if (hours) {
      time.push(hours);
      time.push(':');
    }

    // 0 minutes -> if 0 hours -> Don't add digit
    // 0 minutes -> if hours > 0 -> Add minutes with zero as prefix if minutes < 10
    var minutes = Math.floor(duration / 60) % 60;
    if (time.length) {
      (minutes < 10) && time.push('0');
      time.push(minutes);
    } else if (minutes) {
      time.push(minutes);
    } else {
      time.push('0');
    }
    time.push(':');

    var seconds = duration % 60;
    (seconds < 10) && time.push('0');
    time.push(seconds);

    return time.join('');
  }

  function toPrettySize(size) {
    if (!size) {
      return '';
    }
    if (size < 1048576) {
      return ' / ' + (size / 1024).toFixed(2) + ' kB';
    }
    return ' / ' + (size / 1048576).toFixed(2) + ' MB';
  }

  function getLabelText(archive) {
    var date = new Date(archive.createdAt);

    var time = formatter.format(date).toLowerCase();

    var prefix = '';
    time.indexOf(':') === 1 && (prefix = '0');

    var label = [prefix, time, ' - ', archive.recordingUser, '\'s Archive (',
      toPrettyDuration(archive.duration), toPrettySize(archive.size), ')'];

    return label.join('');
  }

  function isIE() {
    var userAgent = 'userAgent' in navigator && (navigator.userAgent.toLowerCase() || '');
    return /msie/.test(userAgent) || userAgent.indexOf('trident/') !== -1;
  }

  function isSafariMac() {
    var checkObject = function (p) { return p.toString() === '[object SafariRemoteNotification]'; };
    return /constructor/i.test(window.HTMLElement) ||
        checkObject(!window.safari || safari.pushNotification);
  }

  function isSafariIOS() {
    var userAgent = window.navigator.userAgent;
    return userAgent.match(/iPad/i) || userAgent.match(/iPhone/i);
  }

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  // Verify Cognito token
  function verifyToken() {
    var authenticate = function () {
      var protocol = window.location.protocol;
      var host = window.location.host;
      var base = protocol + '//' + host;
      var url = base.concat('/auth/');
      window.location.href = url;
    };

    var validate = function () {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/validateToken", true);
      xhr.onload = function (e) {
        if (xhr.readyState === 4) {
          if (xhr.status !== 200) {
            // Invalidate any previous cookie
            document.cookie = "id_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            // Authenticate again
            authenticate();
          }
        }
      };

      xhr.send(null);
    };

    //document.cookie = 'prev_url=' + window.location.href;

    if (document.cookie.indexOf('id_token=') === -1) {
      if (window.location.hash) {
        var hash = window.location.hash.substring(1);
        var id_token = hash.split('&')[0]
        document.cookie = id_token;
        validate();
      } else {
        authenticate();
      }
    } else {
      validate();
    }
  }

  var Utils = {
    isSafariMac: isSafariMac,
    isSafariIOS: isSafariIOS,
    getCurrentTime: getCurrentTime,
    inspectObject: inspectObject,
    sendEvent: sendEvent,
    addEventsHandlers: addEventsHandlers,
    removeEventHandlers: removeEventHandlers,
    addHandlers: addHandlers,
    get draggableUI() {
      return document.querySelectorAll('[draggable]').length;
    },
    getDraggable: function () {
      return LazyLoader.dependencyLoad([
        '/js/components/draggable.js'
      ]).then(function () {
        return Draggable;
      });
    },
    isScreen: function (item) {
      var type = item.data('streamType');
      return type === 'desktop' || type === 'screen';
    },
    setTransform: setTransform,
    parseSearch: parseSearch,
    generateSearchStr: generateSearchStr,
    decodeStr: decodeStr,
    isChrome: function () {
      var userAgent = 'userAgent' in navigator && (navigator.userAgent.toLowerCase() || '');
      var vendor = 'vendor' in navigator && (navigator.vendor.toLowerCase() || '');
      return /chrome|chromium/i.test(userAgent) && /google inc/.test(vendor);
    },
    setDisabled: setDisabled,
    getLabelText: getLabelText,
    isIE: isIE,
    verifyToken: verifyToken,
    getCookie: getCookie
  };

  // Just replacing global.utils might not be safe... let's just expand it...
  exports.Utils = exports.Utils || {};
  Object.keys(Utils).forEach(function (utilComponent) {
    exports.Utils[utilComponent] = Utils[utilComponent];
  });
}(this));
