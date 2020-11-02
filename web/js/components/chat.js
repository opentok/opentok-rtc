/* global Chat */

!((global) => {
  const transEndEventName = ('WebkitTransition' in document.documentElement.style)
    ? 'webkitTransitionEnd' : 'transitionend';

  let container = null; let chatShown = null; let
    chatHidden = null;

  function init() {
    container = document.querySelector('#chat');
    // Chat consumes 'click' events in order not to be closed automatically
    container.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
    });
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
    chatShown = chatShown || new Promise((resolve) => {
      container.addEventListener(transEndEventName, function onEnd() {
        container.removeEventListener(transEndEventName, onEnd);
        resolve();
      });

      setVisible(true);
      setTimeout(() => {
        container.classList.add('show');
      }, 50); // Give the chance to paint the UI element before fading in
    });

    return chatShown;
  }

  function hide() {
    if (!Chat.visible) {
      return Promise.resolve();
    }

    chatHidden = chatHidden || new Promise((resolve) => {
      container.addEventListener(transEndEventName, function onEnd() {
        container.removeEventListener(transEndEventName, onEnd);
        setVisible(false);
        chatShown = null;
        chatHidden = null;
        Utils.sendEvent('chat:hidden');
        resolve();
      });

      container.classList.remove('collapsed');
      container.classList.remove('show');
    });

    return chatHidden;
  }

  global.Chat = {
    init,
    show,
    hide,
    collapse,
    expand,
    isCollapsed,
    get visible() {
      return container && container.classList.contains('visible');
    }
  };
})(this);
