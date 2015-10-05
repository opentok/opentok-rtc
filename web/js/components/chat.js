!function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend'

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

  function show() {
    chatShown = chatShown || new Promise(function(resolve, reject) {
      container.addEventListener(transEndEventName, function onEnd() {
        container.removeEventListener(transEndEventName, onEnd);
        document.body.addEventListener('click', hide);
        resolve();
      });

      container.classList.add('visible');
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
        document.body.removeEventListener('click', hide);
        container.classList.remove('visible');
        chatShown = chatHidden = null;
        resolve();
      });

      container.classList.remove('show');
    });

    return chatHidden;
  }

  global.Chat = {
    init: init,
    show: show,
    hide: hide,
    get visible() {
      return container && container.classList.contains('visible');
    }
  };

}(this);
