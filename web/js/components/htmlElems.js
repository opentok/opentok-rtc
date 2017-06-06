!(function(exports) {
  'use strict';

  Element.prototype.data = function(name, value) {
    if (!name) {
      return null;
    }

    var dashed = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    if (arguments.length === 2) {
      if (value === null || typeof value === 'undefined') {
        return this.removeAttribute('data-' + dashed);
      }
      return this.setAttribute('data-' + dashed, value);
    }
    return this.getAttribute('data-' + dashed);
  };

  function replaceText(aElem, aText) {
    var newChild = document.createTextNode(aText);
    if (aElem.hasChildNodes()) {
      aElem.replaceChild(newChild, aElem.firstChild);
    } else {
      aElem.appendChild(newChild);
    }
  }

  function addText(aElem, aText) {
    return aElem.appendChild(document.createTextNode(aText));
  }

  function createElement(aType, aAttrs, aOptionalText) {
    var elem = document.createElement(aType);

    // Add all the requested attributes
    if (aAttrs) {
      for (var i in aAttrs) { // eslint-disable-line no-restricted-syntax
        if (i.startsWith('data-')) {
          var dataElem = i.replace('data-', '');
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
    var elem = createElement(aType, aAttrs, aOptionalText);

    if (!aBefore) {
      aMainBody.appendChild(elem);
    } else {
      aMainBody.insertBefore(elem, aBefore);
    }

    return elem;
  }

  function setEnabled(element, enabled) {
    var classList = element.classList;
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
    var list = document.querySelector(selector);

    list.addEventListener('click', function(evt) {
      switch (evt.type) {
        case 'click':
          var elemClicked = evt.target;
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
            }
          });
          break;
      }
    });
  }

  var flush = (function flush() {
    if (Utils.isIE()) {
      // While many attributes, when changed, cause a reflow this doesn't appear to be the case with
      // data-* attributes in Internet Explorer. Changing these will not immediately result in the
      // element being redrawn - we have to trigger out reflow manually.
      return function(elements) {
        elements = Array.isArray(elements) ? elements : [elements];
        elements.forEach(function(element) {
          element = typeof element === 'string' ? document.querySelector(element) : element;
          element && element.classList.toggle('flush-this-element-please');
        });
      };
    }
    return function() {

    };
  }());

  exports.HTMLElems = {
    addText: addText,
    replaceText: replaceText,
    createElement: createElement,
    createElementAt: createElementAt,
    isAction: function(aElem) {
      return (aElem.data('action') !== null);
    },
    setEnabled: setEnabled,
    getAncestorByTagName: getAncestorByTagName,
    addHandlerArchive: addHandlerArchive,
    flush: flush
  };
}(this));
