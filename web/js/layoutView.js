!((global) => {
  const LayoutRenderer = function (container) {
    this.container = container.querySelector('.tc-list ul');
  };

  LayoutRenderer.prototype = {
    defaultOptions: {
      name: '',
      type: 'camera',
      controlElems: {},
    },

    append(id, options) {
      options = options || {};
      Object.keys(this.defaultOptions).forEach(function (option) {
        options[option] = options[option] || this.defaultOptions[option];
      }, this);
      const { type } = options;
      const item = HTMLElems.createElementAt(this.container, 'li', {
        'data-id': id,
        'data-streamType': type,
        class: 'stream',
      }, null, type === 'publisher' ? null : this.container.firstChild);
      const controls = HTMLElems.createElementAt(item, 'div');
      controls.classList.add('controls');
      this.appendControlElems(id, type, controls, options.controlElems, 'i');
      this.appendAdditionalUI(id, item, type, options.name);
      // Streams go inside <span> because of OpenTok overrides <li> styles if this
      // one would be the container.
      HTMLElems.createElementAt(item, 'span').classList.add('opentok-stream-container');
      return item;
    },

    appendAdditionalUI(id, item, type, name) {
      const userInfoElem = HTMLElems.createElementAt(item, 'div');
      userInfoElem.classList.add('user-info');

      const nameElem = HTMLElems.createElementAt(userInfoElem, 'div');
      nameElem.classList.add('name');
      nameElem.textContent = name;

      if (type === 'publisher') {
        HTMLElems.createElementAt(item, 'i', { 'data-icon': 'record' });
      }

      HTMLElems.createElementAt(item, 'div', {
        'data-id': id,
      }).classList.add('dblclick_area');
    },

    appendControlElems(id, type, main, controlElems) {
      if (!controlElems || !Object.keys(controlElems).length) {
        return;
      }

      const controls = HTMLElems.createElementAt(main, 'div');
      controls.classList.add('buttons');

      Object.keys(controlElems).forEach((controlName) => {
        const control = controlElems[controlName];
        const options = {
          'data-icon': control.dataIcon,
          'data-eventName': control.eventFiredName,
          'data-action': controlName,
          'data-streamId': id,
          'data-streamType': type,
        };
        const wrapper = HTMLElems.createElementAt(controls, 'div');
        // IE does not support adding multiple classes
        wrapper.classList.add(`${controlName}-action`);
        if (control.enabled) {
          wrapper.classList.add('enabled');
        }
        HTMLElems.createElementAt(wrapper, 'i', options);
      });
    },

    setAttentionUI(attnObj, streamElem) {
      streamElem.querySelectorAll('.attention').forEach((e) => e.remove());
      streamElem.style.border = `5px solid ${attnObj.color}`;
      const transcriptBox = HTMLElems.createElementAt(streamElem, 'div');
      transcriptBox.classList.add('attention');
      return HTMLElems.createElementAt(transcriptBox, 'p', {}, attnObj.label).classList.add('attention-text');
    },

    remove(item) {
      return this.container.removeChild(item);
    },

    removeAll() {
      this.container.innerHTML = '';
    },
  };

  let renderer = null;

  global.LayoutView = {
    init(container) {
      renderer = new LayoutRenderer(container);
    },

    append(...args) {
      return renderer.append(...args);
    },

    remove(...args) {
      return renderer.remove(...args);
    },

    setAttentionUI(...args) {
      return renderer.setAttentionUI(...args);
    },

    removeAll() {
      renderer.removeAll.apply(renderer);
    },
  };
})(this);
