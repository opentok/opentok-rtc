'use strict';

(function (global) {
  var requestedFragments = {};

  var requestedJS = {};

  global.requireElement = (filename, id) => {
    if (requestedFragments[filename]) {
      return;
    }

    requestedFragments[filename] = true;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, false /* intentional sync */);
    xhr.send();

    var htmlFragment = document.createElement('div');
    htmlFragment.innerHTML = xhr.responseText;

    var container = document.createElement('div');
    if (id) {
      container.id = id;
    }
    container.innerHTML = htmlFragment.querySelector('template').innerHTML;

    document.body.appendChild(container);
  };

  global.require = (filename, callback) => {
    if (requestedJS[filename]) {
      return;
    }

    requestedJS[filename] = true;

    var script = document.createElement('script');
    script.src = filename;
    script.async = false;
    typeof callback === 'function' && script.addEventListener('load', callback);
    document.head.appendChild(script);
  };
}(this));
