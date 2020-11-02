/* global safari, LazyLoader, Draggable */
!((exports) => {
  const getCurrentTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const inspectObject = (obj) => {
    let str = '';
    Object.keys(obj).forEach((elto) => {
      str += `\n${elto}:${JSON.stringify(obj[elto])}`;
    });
    return str;
  };

  const sendEvent = (eventName, data, target) => {
    data = data ? { detail: data } : {};
    const newEvt = new CustomEvent(eventName, data);
    (target || exports).dispatchEvent(newEvt);
  };

  const addHandlers = (events) => {
    Object.keys(events).forEach((evtName) => {
      const event = events[evtName];
      (event.target || exports).addEventListener(event.name, event.handler);
    });
  };

  const addEventsHandlers = (eventPreffixName, handlers, target) => {
    eventPreffixName = eventPreffixName || '';
    Object.keys(handlers).forEach((eventName) => {
      (target || exports).addEventListener(eventPreffixName + eventName, handlers[eventName]);
    });
  };

  const removeEventHandlers = (eventPreffixName, handlers, target) => {
    eventPreffixName = eventPreffixName || '';
    Object.keys(handlers).forEach((eventName) => {
      (target || exports).removeEventListener(eventPreffixName + eventName, handlers[eventName]);
    });
  };

  const setTransform = (style, transform) => {
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
  const parseSearch = (aSearchStr) => {
    aSearchStr = decodeStr(aSearchStr);
    return aSearchStr.slice(1).split('&')
      .map((aParam) => aParam.split(/=(.+)?/))
      .reduce((aObject, aCurrentValue) => {
        const parName = aCurrentValue[0];
        aObject.params[parName] = _addValue(aObject.params[parName], aCurrentValue[1] || null);
        return aObject;
      },
      {
        params: {},
        getFirstValue(aParam) {
          return Array.isArray(this.params[aParam]) ? this.params[aParam][0] : this.params[aParam];
        }
      });
  };

  // Aux function to generate a search str from an object with
  // key: value or key: [value1,value2] structure.
  function generateSearchStr(aObject) {
    return Object.keys(aObject)
      .reduce((aPrevious, aParam, aIndex) => {
        let value = aObject[aParam];
        value = Array.isArray(value) ? value : [value];
        value.forEach((aSingleValue, aValueIndex) => {
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

  const setDisabled = (element, disabled) => {
    element.disabled = disabled;
    disabled ? element.setAttribute('disabled', 'disabled')
      : element.removeAttribute('disabled');
  };

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  function toPrettyDuration(duration) {
    const time = [];

    // 0 hours -> Don't add digit
    const hours = Math.floor(duration / (60 * 60));
    if (hours) {
      time.push(hours);
      time.push(':');
    }

    // 0 minutes -> if 0 hours -> Don't add digit
    // 0 minutes -> if hours > 0 -> Add minutes with zero as prefix if minutes < 10
    const minutes = Math.floor(duration / 60) % 60;
    if (time.length) {
      (minutes < 10) && time.push('0');
      time.push(minutes);
    } else if (minutes) {
      time.push(minutes);
    } else {
      time.push('0');
    }
    time.push(':');

    const seconds = duration % 60;
    (seconds < 10) && time.push('0');
    time.push(seconds);

    return time.join('');
  }

  function toPrettySize(size) {
    if (!size) {
      return '';
    }
    if (size < 1048576) {
      return ` / ${(size / 1024).toFixed(2)} kB`;
    }
    return ` / ${(size / 1048576).toFixed(2)} MB`;
  }

  function getLabelText(archive) {
    const date = new Date(archive.createdAt);

    const time = formatter.format(date).toLowerCase();

    let prefix = '';
    time.indexOf(':') === 1 && (prefix = '0');

    const label = [prefix, time, ' - ', archive.recordingUser, '\'s Archive (',
      toPrettyDuration(archive.duration), toPrettySize(archive.size), ')'];

    return label.join('');
  }

  function isSafariMac() {
    const checkObject = (p) => p.toString() === '[object SafariRemoteNotification]';
    return /constructor/i.test(window.HTMLElement)
        || checkObject(!window.safari || safari.pushNotification);
  }

  function isSafariIOS() {
    const { userAgent } = window.navigator;
    return userAgent.match(/iPad/i) || userAgent.match(/iPhone/i);
  }

  function htmlEscape(str) {
    return String(str)
      .replace(/&/g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/'/g, '')
      .replace(/\\/g, '')
      .replace(/;/g, '');
  }

  const Utils = {
    isSafariMac,
    isSafariIOS,
    getCurrentTime,
    inspectObject,
    sendEvent,
    addEventsHandlers,
    removeEventHandlers,
    addHandlers,
    get draggableUI() {
      return document.querySelectorAll('[draggable]').length;
    },
    getDraggable() {
      return LazyLoader.dependencyLoad([
        '/js/components/draggable.js'
      ]).then(() => Draggable);
    },
    isScreen(item) {
      const type = item.data('streamType');
      return type === 'desktop' || type === 'screen';
    },
    setTransform,
    parseSearch,
    generateSearchStr,
    decodeStr,
    isChrome() {
      const userAgent = 'userAgent' in navigator && (navigator.userAgent.toLowerCase() || '');
      const vendor = 'vendor' in navigator && (navigator.vendor.toLowerCase() || '');
      return /chrome|chromium/i.test(userAgent) && /google inc/.test(vendor);
    },
    setDisabled,
    getLabelText,
    htmlEscape
  };

  // Just replacing global.utils might not be safe... let's just expand it...
  exports.Utils = exports.Utils || {};
  Object.keys(Utils).forEach((utilComponent) => {
    exports.Utils[utilComponent] = Utils[utilComponent];
  });
})(this);
