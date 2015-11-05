!function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
    'webkitTransitionEnd' : 'transitionend';

  var closeHandlers = {};

  function addCloseHandler(selector) {
    var closeElement = document.querySelector(selector + ' .close');
    if (!closeElement) {
      return;
    }

    var handler = Modal.hide.bind(Modal, selector);
    closeHandlers[selector] = {
      target: closeElement,
      handler: handler
    };

    closeElement.addEventListener('click', handler);
  }

  function removeCloseHandler(selector) {
    var obj = closeHandlers[selector];
    obj && obj.target.removeEventListener('click', obj.handler);
  }

  function show(selector) {
    return new Promise(function(resolve, reject) {
      var modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
        addCloseHandler(selector);
        resolve();
      });

      modal.classList.add('visible');
      modal.classList.add('show');
    });
  }

  function hide(selector) {
    return new Promise(function(resolve, reject) {
      var modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
        modal.classList.remove('visible');
        resolve();
      });
      removeCloseHandler(selector);
      modal.classList.remove('show');
    });
  }

  global.Modal = {
    show: show,
    hide: hide
  };

}(this);
