
'use strict';

var Layout = function(selector) {
  this.items = {};
  this.container = document.querySelector(selector);
  this.container.addEventListener('click', this);
  var events = ['roomController:video', 'roomController:audio'];
  events.forEach(function(name) {
    window.addEventListener(name, this);
  }, this);
};

Layout.prototype = {
  handleEvent: function(evt) {
    switch (evt.type) {
      case 'click':
        var elemClicked = evt.target;
        if (!(HTMLElems.isAction(elemClicked))) {
          return;
        }
        var dataset = elemClicked.dataset;
        Utils.sendEvent(dataset.eventName, {
          streamId: dataset.streamId,
          name: dataset.action,
          streamType: dataset.streamType
        });
        break;

      case 'roomController:video':
      case 'roomController:audio':
        var item = this.items[evt.detail.id];
        if (!item) {
          return;
        }

        var action = evt.type.replace('roomController:', '');
        HTMLElems.setEnabled(item.querySelector('.' + action + '-action'),
                             evt.detail.enabled);
        break;
    }
  },

  append: function(id, type, controlElems, name) {
    var item =
      HTMLElems.createElementAt(this.container, this.itemType, { 'data-id': id });
    var controls = HTMLElems.createElementAt(item, 'div');
    controls.classList.add('controls');
    this._appendControlElems(id, type, controls, controlElems, this.itemControlType);
    this._appendAdditionalUI(item, name);
    this.items[id] = item;
    this.rearrange();
    return item;
  },

  _appendAdditionalUI: function(item, name) {
    var userInfoElem = HTMLElems.createElementAt(item, 'div');
    userInfoElem.classList.add('user-info');

    var nameElem = HTMLElems.createElementAt(userInfoElem, 'div');
    nameElem.classList.add('name');
    nameElem.textContent = name;
  },

  _appendControlElems: function(id, type, main, controlElems, itemControlType) {
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
      wrapper.classList.add(controlName + '-action', 'enabled');
      HTMLElems.createElementAt(wrapper, 'i', options);
    });
  },

  remove: function(id) {
    this.container.removeChild(this.items[id]);
    this.items[id] = null;
    this.rearrange();
  },

  rearrange: function() {
    var features = this.features();
    Array.prototype.map.call(this.container.children, function(item) {
      var style = item.style;
      Object.keys(features).forEach(function(feature) {
        style[feature] = features[feature];
      });
    });
  },

  features: function() {
    return {};
  }
};

var Grid = function(selector) {
  Layout.apply(this, arguments);

  var tcList = HTMLElems.createElementAt(this.container, 'div');
  tcList.classList.add('tc-list', 'grid');
  this.container = HTMLElems.createElementAt(tcList, 'ul');
  this.itemType = 'li';
  this.itemControlType = 'i';
};

Grid.prototype = {
  __proto__: Layout.prototype,

  _VERTICAL_PADDING: 0.2,

  _HORIZONTAL_PADDING: 0.6,

  append: function(id, type, controlElems) {
    var item = Layout.prototype.append.apply(this, arguments);
    // Streams go inside <span> because of OpenTok overrides <li> styles if this
    // one would be the container.
    return HTMLElems.createElementAt(item, 'span');
  },

  features: function() {
    var total = this.container.children.length;
    var columns = Math.ceil(Math.sqrt(total));

    return {
      width: ((100 / columns) - this._HORIZONTAL_PADDING)+ '%',
      height: ((100 / Math.ceil(total / columns)) - this._VERTICAL_PADDING) + '%'
    };
  }
};
