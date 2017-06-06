!(function (exports) {
  'use strict';

  var realChat = null;
  var depth = 0;

  var MockChat = {
    _isVisible: true,
    _isCollapsed: true,
    _install() {
      depth++;
      if (depth > 1) {
        return; // Do nothing...
      }
      realChat = exports.Chat;
      exports.Chat = MockChat;
    },
    _restore() {
      depth--;
      if (depth > 0) {
        return;
      }
      exports.Chat = realChat;
    },
    get visible() {
      return this._isVisible;
    },
    show() {
      return Promise.resolve();
    },
    hide() {
      return Promise.resolve();
    },
    isCollapsed() {
      return this._isCollapsed;
    },
    expand() {},
    collapse() {},
    init() {},
  };

  exports.MockChat = MockChat;
}(this));
