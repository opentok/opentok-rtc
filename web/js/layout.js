
'use strict';

var Layout = function(selector) {
  this.container = document.querySelector(selector);
  this.container.addEventListener('click', this);
};

Layout.prototype = {
  handleEvent: function(evt) {
    switch (evt.type) {
      case 'click':
        var elemClicked = evt.target;
        if (!(HTMLElems.isAction(elemClicked))) {
          return;
        }
        elemClicked.classList.toggle('enabled');
        var dataset = elemClicked.dataset;
        Utils.sendEvent(dataset.eventName, {
          streamId: dataset.streamId,
          name: dataset.action
        });
        break;
    }
  },

  append: function(id, type, controlElems) {
    var item =
      HTMLElems.createElementAt(this.container, this.itemType, { 'data-id': id });
    this._appendControlElems(id, type, item, controlElems, this.itemControlType);
    this.rearrange();
    return item;
  },

  _appendControlElems: function(id, type, main, controlElems, itemControlType) {
    controlElems && Object.keys(controlElems).forEach(function(controlName) {
      var control = controlElems[controlName];
      var options = {
        'data-icon': control.dataIcon,
        'data-eventName': control.eventFiredName,
        'data-action': controlName,
        'data-streamId': id,
        'data-streamType': type
      };
      var item = HTMLElems.createElementAt(main, 'i', options);
      item.classList.add('enabled');
    });
  },

  remove: function(id) {
    this.container.
      removeChild(this.container.querySelector('[data-id="' + id + '"]'));
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

  append: function(id, controlElems) {
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
