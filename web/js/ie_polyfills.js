// This file adds what we've detected that's missing in IE and we've used inadvertently. We've
// tried to be as vanilla as possible (except for promises) but sometimes surprising things fall
// between the cracks

!function(global) {
  // String doesn't have startsWith
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(substr) {
      return this.indexOf(substr) === 0;
    };
  }

  // window.location.origin doesn't exist in IE...
  if (global && global.location && !global.location.origin) {
    // So we just create it:
    var loc = global.location;
    global.location.origin = loc.protocol + '//' + loc.host;
  }

  // And IE uses a curious way to init custom events... and to make things more
  // interesting, CustomEvent exists also, only it's not a constructor.
  // Note that this is total and completely *unsafe* to do if you're using
  // external libraries that depend on CustomEvent in IE being what it is!
  if (typeof global.CustomEvent !== 'function') {
    global._ieCustomEvent = global.CustomEvent;
    global.CustomEvent = function(eventName, initDict) {
      var evt = document.createEvent('CustomEvent');
      var detail = initDict && initDict.detail || undefined;
      evt.initCustomEvent(eventName, true, true, detail);
      return evt;
    };
  }

  if (typeof global.URL !== 'function') {
    global._ieURL = global.URL;
    global.URL = function(str) {
      var parser = document.createElement('a');
      parser.href = str;
      if (!parser.hostname) {
        throw new Error('URL is not valid');
      }
    };
    global.URL.createObjectURL = global._ieURL.createObjectURL;
    global.URL.revokeObjectURL = global._ieURL.revokeObjectURL;
  }
}(this);
