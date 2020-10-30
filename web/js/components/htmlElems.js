!((exports) => {
  Element.prototype.data = function (name, value) {
    if (!name) {
      return null;
    }

    const dashed = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    if (arguments.length === 2) {
      if (value === null || typeof value === 'undefined') {
        return this.removeAttribute(`data-${dashed}`);
      }
      return this.setAttribute(`data-${dashed}`, value);
    }
    return this.getAttribute(`data-${dashed}`);
  };

  function replaceText(aElem, aText) {
    const newChild = document.createTextNode(aText);
    if (aElem.hasChildNodes()) {
      aElem.replaceChild(newChild, aElem.firstChild);
    } else {
      aElem.appendChild(newChild);
    }
  }

  function addText(aElem, aText) {
    const lines = aText.split(/\r?\n/);

    function addLine(line) {
      if (line.length > 0) {
        aElem.appendChild(document.createTextNode(line));
      }
    }

    addLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      aElem.appendChild(document.createElement('BR'));
      addLine(lines[i]);
    }
  }

  function createElement(aType, aAttrs, aOptionalText) {
    const elem = document.createElement(aType);

    // Add all the requested attributes
    if (aAttrs) {
      for (const i in aAttrs) { // eslint-disable-line no-restricted-syntax
        if (i.startsWith('data-')) {
          const dataElem = i.replace('data-', '');
          elem.data(dataElem, aAttrs[i]);
        } else {
          elem.setAttribute(i, aAttrs[i]);
        }
      }
    }

    if (aOptionalText) {
      addText(elem, aOptionalText);
    }

    return elem;
  }

  function createElementAt(aMainBody, aType, aAttrs, aOptionalText, aBefore) {
    const elem = createElement(aType, aAttrs, aOptionalText);

    if (!aBefore) {
      aMainBody.appendChild(elem);
    } else {
      aMainBody.insertBefore(elem, aBefore);
    }

    return elem;
  }

  function setEnabled(element, enabled) {
    const { classList } = element;
    enabled ? classList.add('enabled') : classList.remove('enabled');
  }

  function getAncestorByTagName(el, tagName) {
    tagName = tagName.toUpperCase();
    if (el.tagName === tagName) {
      return el;
    }
    while (el.parentNode) {
      el = el.parentNode;
      if (el.tagName === tagName) {
        return el;
      }
    }
    return null;
  }

  function addHandlerArchive(selector) {
    const list = document.querySelector(selector);

    list.addEventListener('click', (evt) => {
      if (evt.type === 'click') {
        const elemClicked = evt.target;
        if (!(HTMLElems.isAction(elemClicked))) {
          return;
        }
        Utils.sendEvent('archive', {
          id: elemClicked.data('id'),
          action: elemClicked.data('action'),
          username: elemClicked.data('username'),
          set status(value) {
            elemClicked.parentNode.data('status', value);
          },
          get status() {
            return elemClicked.parentNode.data('status');
          },
        });
      }
    });
  }

  exports.HTMLElems = {
    addText,
    replaceText,
    createElement,
    createElementAt,
    isAction(aElem) {
      return (aElem.data('action') !== null);
    },
    setEnabled,
    getAncestorByTagName,
    addHandlerArchive,
  };
})(this);
