!(function (global) {
  'use strict';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
    'webkitTransitionEnd' : 'transitionend';

  var closeHandlers = {};
  var keyPressHandler;
  var _queuedModals = [];
  var _modalShown = false;
  var preShowFocusElement;

  function addCloseHandler(selector) {
    var closeElement = document.querySelector(selector + ' .close');
    if (!closeElement) {
      return;
    }

    var handler = function () {
      Utils.sendEvent('modal:close');
      hide(selector);
    };
    closeHandlers[selector] = {
      target: closeElement,
      handler: handler
    };

    keyPressHandler = function (event) {
      var keyCode = event.which || event.keyCode;
      if (keyCode === 27) { // escape key maps to keycode `27`
        handler();
      }
    };

    closeElement.addEventListener('click', handler);
    document.body.addEventListener('keyup', keyPressHandler);
  }

  function removeCloseHandler(selector) {
    var obj = closeHandlers[selector];
    obj && obj.target.removeEventListener('click', obj.handler);
    document.body.removeEventListener('keyup', keyPressHandler);
  }

  function show(selector, preShowCb, allowMultiple) {
    var screenFree;
    preShowFocusElement = document.activeElement;
    preShowFocusElement && preShowFocusElement.blur();
    if (!_modalShown || allowMultiple) {
      screenFree = Promise.resolve();
    } else {
      screenFree = new Promise(function (resolve) {
        _queuedModals.push(resolve);
      });
    }

    return screenFree.then(function () {
      return new Promise(function (resolve) {
        _modalShown = true;
        preShowCb && preShowCb();
        var modal = document.querySelector(selector);
        modal.addEventListener(transEndEventName, function onTransitionend() {
          modal.removeEventListener(transEndEventName, onTransitionend);
          addCloseHandler(selector);
          resolve();
        });
        modal.classList.add('visible');
        modal.classList.add('show');
      });
    });
  }

  function hide(selector) {
    return new Promise(function (resolve) {
      var modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
        modal.classList.remove('visible');
        preShowFocusElement && preShowFocusElement.focus();
        resolve();
      });
      removeCloseHandler(selector);
      modal.classList.remove('show');
    }).then(function () {
      _modalShown = false;
      var nextScreen = _queuedModals.shift();
      nextScreen && nextScreen();
    });
  }

  function showConfirm(txt, allowMultiple) {
    var selector = '.switch-alert-modal';
    var ui = document.querySelector(selector);
    function loadModalText() {
      ui.querySelector(' header .msg').textContent = txt.head;
      ui.querySelector(' p.detail').innerHTML = txt.detail;
      ui.querySelector(' footer button.accept').textContent = txt.button;
      var altButton = ui.querySelector(' footer button.alt-accept');

      // Remove extra button if its there to avoid duplicates
      if (altButton) {
        altButton.parentNode.removeChild(altButton);
      }
      //Add extra button if we include text for it
      if (txt.altButton) {
        var footer = ui.querySelector('footer')
        var newBtn = document.createElement("button");
        newBtn.className = "btn btn-purple btn-padding ctaarrow-white alt-accept";
        newBtn.textContent = txt.altButton;
        footer.appendChild(newBtn);
      } 
    }

    return show(selector, loadModalText, allowMultiple)
      .then(function () {
        return new Promise(function (resolve) {
          ui.addEventListener('click', function onClicked(evt) {
            var classList = evt.target.classList;
            var hasAccepted = classList.contains('accept');
            var altHasAccepted = classList.contains('alt-accept');
            if (evt.target.id !== 'switchAlerts' && !hasAccepted && !altHasAccepted && !classList.contains('close')) {
              return;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();
            ui.removeEventListener('click', onClicked);
            hide(selector).then(function () {
              BubbleFactory.get('chooseLayout').hide();
              if (altHasAccepted) return resolve({altHasAccepted});
              else return resolve(hasAccepted);
            });
          });
        });
      });
  }

  global.Modal = {
    show: show,
    hide: hide,
    showConfirm: showConfirm
  };
}(this));
