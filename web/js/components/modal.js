!(global => {
  const transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
      'webkitTransitionEnd' : 'transitionend';

  const closeHandlers = {};
  let keyPressHandler;
  const _queuedModals = [];
  let _modalShown = false;
  let preShowFocusElement;

  function addCloseHandler(selector) {
    const closeElement = document.querySelector(`${selector} .close`);
    if (!closeElement) {
      return;
    }

    const handler = () => {
      Utils.sendEvent('modal:close');
      hide(selector);
    };
    closeHandlers[selector] = {
      target: closeElement,
      handler
    };

    keyPressHandler = event => {
      const keyCode = event.which || event.keyCode;
      if (keyCode === 27) { // escape key maps to keycode `27`
        handler();
      }
    };

    closeElement.addEventListener('click', handler);
    document.body.addEventListener('keyup', keyPressHandler);
  }

  function removeCloseHandler(selector) {
    const obj = closeHandlers[selector];
    obj && obj.target.removeEventListener('click', obj.handler);
    document.body.removeEventListener('keyup', keyPressHandler);
  }

  function show(selector, preShowCb, allowMultiple) {
    let screenFree;
    preShowFocusElement = document.activeElement;
    preShowFocusElement && preShowFocusElement.blur();
    if (!_modalShown || allowMultiple) {
      screenFree = Promise.resolve();
    } else {
      screenFree = new Promise(resolve => {
        _queuedModals.push(resolve);
      });
    }

    return screenFree.then(() => {
      return new Promise(resolve => {
        _modalShown = true;
        preShowCb && preShowCb();
        const modal = document.querySelector(selector);
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

  function flashMessage(selector) {
    Modal.show(selector);
    setTimeout(() => {
      Modal.hide(selector);
    }, 2000);
  }

  function hide(selector) {
    return new Promise(resolve => {
      const modal = document.querySelector(selector);

      modal.addEventListener(transEndEventName, function onTransitionend() {
        modal.removeEventListener(transEndEventName, onTransitionend);
        modal.classList.remove('visible');
        preShowFocusElement && preShowFocusElement.focus();
        resolve();
      });
      removeCloseHandler(selector);
      modal.classList.remove('show');
    }).then(() => {
      _modalShown = false;
      const nextScreen = _queuedModals.shift();
      nextScreen && nextScreen();
    });
  }

  function showConfirm(txt, allowMultiple) {
    const selector = '.switch-alert-modal';
    const ui = document.querySelector(selector);
    function loadModalText() {
      ui.querySelector(' header .msg').textContent = txt.head;
      ui.querySelector(' p.detail').innerHTML = txt.detail;
      ui.querySelector(' footer button.accept').textContent = txt.button;
      const altButton = ui.querySelector(' footer button.alt-accept');

      // Remove extra button if its there to avoid duplicates
      if (altButton) {
        altButton.parentNode.removeChild(altButton);
      }
      // Add extra button if we include text for it
      if (txt.altButton) {
        const footer = ui.querySelector('footer');
        const newBtn = document.createElement('button');
        newBtn.className = 'btn btn-black btn-padding alt-accept';
        newBtn.textContent = txt.altButton;
        footer.appendChild(newBtn);
      }
    }

    return show(selector, loadModalText, allowMultiple)
      .then(() => {
        return new Promise(resolve => {
          ui.addEventListener('click', function onClicked(evt) {
            const classList = evt.target.classList;
            const hasAccepted = classList.contains('accept');
            const altHasAccepted = classList.contains('alt-accept');
            if (evt.target.id !== 'switchAlerts' && !hasAccepted && !altHasAccepted && !classList.contains('close')) {
              return;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();
            ui.removeEventListener('click', onClicked);
            hide(selector).then(() => {
              if (altHasAccepted) return resolve({ altHasAccepted });
              return resolve(hasAccepted);
            });
          });
        });
      });
  }

  global.Modal = {
    flashMessage,
    show,
    hide,
    showConfirm
  };
})(this);
