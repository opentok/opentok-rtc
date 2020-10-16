/*
 this content-script plays role of medium to publish/subscribe
 messages from webpage to the background script
*/
// eslint-disable-next-line no-undef
var extensionID = chrome.runtime.id;

var prefix = 'com.tokbox.screenSharing.' + extensionID;

// this port connects with background script
// eslint-disable-next-line no-undef
var port = chrome.runtime.connect();

var method = event.data[prefix];
var payload = event.data.payload;

var response = function (method1, payload1) {
  var res = { payload: payload1, from: 'extension' };
  res[prefix] = method1;
  return res;
};

// if background script sent a message
port.onMessage.addListener(function (message) {
  if (message && message.method === 'permissionDenied') {
    window.postMessage(response('permissionDenied', message.payload), '*');
  } else if (message && message.method === 'sourceId') {
    window.postMessage(response('sourceId', message.payload), '*');
  }
});

// this event handler watches for messages sent from the webpage
// it receives those messages and forwards to background script
window.addEventListener('message', function (event) {

  if (event.source !== window) {
    return undefined;
  }

  if (!(event.data != null && typeof event.data === 'object' && event.data[prefix]
    && event.data.payload != null && typeof event.data.payload === 'object')) {
    return undefined;
  }

  if (event.data.from !== 'jsapi') {
    return undefined;
  }

  if (!payload.requestId) {
    console.warn('Message to screen sharing extension does not have a requestId for replies.');
    return undefined;
  }

  if (method === 'isExtensionInstalled') {
    return window.postMessage(response('extensionLoaded', payload), '*');
  }

  if (method === 'getSourceId') {
    return port.postMessage({ method: 'getSourceId', payload: payload });
  }
  return undefined;
});

// inform browser that you're available!
window.postMessage(response('extensionLoaded'), '*');
