!function(exports) {
  'use strict';

  var realChat = null;
  var depth = 0;

  var MockChat = {
    _isVisible: true,
    _isCollapsed: true,
    _install: function() {
      depth++;
      if (depth > 1 ) {
        return; // Do nothing...
      }
      realChat = exports.Chat;
      exports.Chat = MockChat;
    },
    _restore: function() {
      depth--;
      if (depth > 0) {
        return;
      }
      exports.Chat = realChat;
    },
    get visible() {
      return this._isVisible;
    },
    show: function() {
      return Promise.resolve();
    },
    hide: function() {
      return Promise.resolve();
    },
    isCollapsed: function() {
      return this._isCollapsed;
    },
    expand: function() {},
    collapse: function() {},
    init: function() {}
  };

  exports.MockChat = MockChat;

}(this);
