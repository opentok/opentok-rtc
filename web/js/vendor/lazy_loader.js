/* exported LazyLoader */
/* globals HtmlImports, Promise */
'use strict';

/**
 * This contains a simple LazyLoader implementation
 * To use:
 *
 *   LazyLoader.load(
 *    ['/path/to/file.js', '/path/to/file.css', 'domNode']).
*       then(callback);
 */
var LazyLoader = (function() {

  function LazyLoader() {
    this._loaded = {};
    this._isLoading = {};
  }

  LazyLoader.prototype = {

    _js: function(file, callback) {
      var script = document.createElement('script');
      script.src = file;
      // until bug 916255 lands async is the default so
      // we must disable it so scripts load in the order they where
      // required.
      script.async = false;
      script.addEventListener('load', callback);
      document.head.appendChild(script);
      this._isLoading[file] = script;
    },

    _css: function(file, callback) {
      var style = document.createElement('link');
      style.type = 'text/css';
      style.rel = 'stylesheet';
      style.href = file;
      document.head.appendChild(style);
      callback();
    },

    _html: function(domNode, callback) {

      // The next few lines are for loading html imports in DEBUG mode
      if (domNode.getAttribute('is')) {
        this.load(['libs/html_imports.js'], function() {
          HtmlImports.populate(callback);
        }.bind(this));
        return;
      }

      for (var i = 0; i < domNode.childNodes.length; i++) {
        if (domNode.childNodes[i].nodeType == document.COMMENT_NODE) {
          domNode.innerHTML = domNode.childNodes[i].nodeValue;
          break;
        }
      }

      window.dispatchEvent(new CustomEvent('lazyload', {
        detail: domNode
      }));

      callback();
    },

    /**
     * Retrieves content of JSON file.
     *
     * @param {String} file Path to JSON file
     * @return {Promise} A promise that resolves to the JSON content
     * or null in case of invalid path. Rejects if an error occurs.
     */
    getJSON: function(file) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', file, true);
        xhr.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
        xhr.responseType = 'json';

        xhr.onerror = function(error) {
          reject(error);
        };
        xhr.onload = function() {
          if (xhr.response !== null) {
            resolve(xhr.response);
          } else {
            reject(new Error('No valid JSON object was found (' +
			     xhr.status + ' ' + xhr.statusText + ')'));
          }
        };

        xhr.send();
      });
    },

    // Loads a set of files that depend one of each other...
    dependencyLoad: function(files) {
      var self = this;
      return new Promise(function(resolve, reject) {
        function loadFile(index) {
          self.load([files[index]]).then(function() {
            if (++index === files.length) {
              resolve();
            } else {
              loadFile(index);
            }
          });
        }
        loadFile(0);
      });
    },

    load: function(files) {
      if (!Array.isArray(files)) {
        files = [files];
      }
      var loadsRemaining = files.length, self = this;

      return new Promise(function(resolve, reject) {

        function perFileCallback(file) {
          if (self._isLoading[file]) {
            delete self._isLoading[file];
          }
          self._loaded[file] = true;

          if (--loadsRemaining === 0) {
              resolve();
          }
        }

        for (var i = 0; i < files.length; i++) {
          var file = files[i];

          if (this._loaded[file.id || file]) {
            perFileCallback(file);
          } else if (this._isLoading[file]) {
            this._isLoading[file].addEventListener(
              'load', perFileCallback.bind(null, file));
          } else {
            var method, idx;
            if (typeof file === 'string') {
              method = file.match(/\.([^.]+)$/)[1];
              idx = file;
            } else {
              method = 'html';
              idx = file.id;
            }

            this['_' + method](file, perFileCallback.bind(null, idx));
          }
        }
      }.bind(self));
    }
  };

  return new LazyLoader();
}());
