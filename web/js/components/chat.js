!(function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  var container = null,
    chatShown = null,
    chatHidden = null;

  function init() {
    container = document.querySelector('#chat');
    // Chat consumes 'click' events in order not to be closed automatically
    container.addEventListener('click', function(e) {
      e.stopImmediatePropagation();
    });
  }

  function onClick(evt) {
    if (evt.target.id !== 'closeChat' && !isCollapsed()) {
      hide();
    }
  }

  function collapse() {
    container.classList.add('collapsed');
  }

  function expand() {
    container.classList.remove('collapsed');
  }

  function isCollapsed() {
    return container.classList.contains('collapsed');
  }

  function setVisible(visible) {
    document.body.data('chatVisible', visible);
    visible ? container.classList.add('visible') : container.classList.remove('visible');
  }

  function show() {
    chatShown = chatShown || new Promise(function(resolve, reject) {
      container.addEventListener(transEndEventName, function onEnd() {
        container.removeEventListener(transEndEventName, onEnd);
        document.body.addEventListener('click', onClick);
        resolve();
      });

      setVisible(true);
      setTimeout(function() {
        container.classList.add('show');
      }, 50); // Give the chance to paint the UI element before fading in
    });

    return chatShown;
  }

  function hide() {
    if (!Chat.visible) {
      return Promise.resolve();
    }

    chatHidden = chatHidden || new Promise(function(resolve, reject) {
      container.addEventListener(transEndEventName, function onEnd() {
        container.removeEventListener(transEndEventName, onEnd);
        document.body.removeEventListener('click', onClick);
        setVisible(false);
        chatShown = chatHidden = null;
        Utils.sendEvent('chat:hidden');
        resolve();
      });

      container.classList.remove('collapsed');
      container.classList.remove('show');
    });

    return chatHidden;
  }

  global.Chat = {
    init: init,
    show: show,
    hide: hide,
    collapse: collapse,
    expand: expand,
    isCollapsed: isCollapsed,
    get visible() {
      return container && container.classList.contains('visible');
    }
  };
}(this));
