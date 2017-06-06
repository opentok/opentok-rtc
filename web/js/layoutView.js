!(function(global) {
  'use strict';

  var LayoutRenderer = function(container) {
    this.container = container.querySelector('.tc-list ul');
  };

  LayoutRenderer.prototype = {
    defaultOptions: {
      name: '',
      type: 'camera',
      controlElems: {}
    },

    append: function(id, options) {
      options = options || {};
      Object.keys(this.defaultOptions).forEach(function(option) {
        options[option] = options[option] || this.defaultOptions[option];
      }, this);
      var type = options.type;
      var item = HTMLElems.createElementAt(this.container, 'li', {
        'data-id': id,
        'data-streamType': type,
        class: 'stream'
      }, null, type === 'publisher' ? null : this.container.firstChild);
      var controls = HTMLElems.createElementAt(item, 'div');
      controls.classList.add('controls');
      this.appendControlElems(id, type, controls, options.controlElems, 'i');
      this.appendAdditionalUI(id, item, type, options.name);
      // Streams go inside <span> because of OpenTok overrides <li> styles if this
      // one would be the container.
      HTMLElems.createElementAt(item, 'span').classList.add('opentok-stream-container');
      return item;
    },

    appendAdditionalUI: function(id, item, type, name) {
      var userInfoElem = HTMLElems.createElementAt(item, 'div');
      userInfoElem.classList.add('user-info');

      var nameElem = HTMLElems.createElementAt(userInfoElem, 'div');
      nameElem.classList.add('name');
      nameElem.textContent = name;

      if (type === 'publisher') {
        HTMLElems.createElementAt(item, 'i', { 'data-icon': 'record' });
      }

      HTMLElems.createElementAt(item, 'div', {
        'data-id': id
      }).classList.add('dblclick_area');
    },

    appendControlElems: function(id, type, main, controlElems, itemControlType) {
      if (!controlElems || !Object.keys(controlElems).length) {
        return;
      }

      var controls = HTMLElems.createElementAt(main, 'div');
      controls.classList.add('buttons');

      Object.keys(controlElems).forEach(function(controlName) {
        var control = controlElems[controlName];
        var options = {
          'data-icon': control.dataIcon,
          'data-eventName': control.eventFiredName,
          'data-action': controlName,
          'data-streamId': id,
          'data-streamType': type
        };
        var wrapper = HTMLElems.createElementAt(controls, 'div');
        // IE does not support adding multiple classes
        wrapper.classList.add(controlName + '-action');
        wrapper.classList.add('enabled');
        HTMLElems.createElementAt(wrapper, 'i', options);
      });
    },

    remove: function(item) {
      return this.container.removeChild(item);
    },

    removeAll: function() {
      this.container.innerHTML = '';
    }
  };

  var renderer = null;

  global.LayoutView = {
    init: function(container) {
      renderer = new LayoutRenderer(container);
    },

    append: function(id, options) {
      return renderer.append.apply(renderer, arguments);
    },

    remove: function(item) {
      return renderer.remove.apply(renderer, arguments);
    },

    removeAll: function() {
      renderer.removeAll.apply(renderer);
    }
  };
}(this));
