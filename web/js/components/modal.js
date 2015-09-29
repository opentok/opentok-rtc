!function(global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend'

  function show(selector) {
    return new Promise(function(resolve, reject) {
      var modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
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
      modal.classList.remove('show');
    });
  }

  global.Modal = {
    show: show,
    hide: hide
  };

}(this);
