
'use strict';

var Layout = function(selector) {
  this.container = document.querySelector(selector);
  this.container.addEventListener('click', function(evt) {
      var elemClicked = evt.target;
      var dataset = elemClicked.dataset;
      if (!'eventName' in dataset) {
        return;
      }
      elemClicked.classList.toggle('enabled');
      var newEvt =
        new CustomEvent(dataset.eventName,
                        {
                          detail: {
                            streamId: dataset.streamId,
                            name: dataset.controlName
                          }
                        });
      window.dispatchEvent(newEvt);
    });
};

Layout.prototype = {
  append: function(streamId, controlElems) {
    var item =
      HTMLElems.createElementAt(this.container, this.itemType,
                                { 'data-id': streamId });
    if (controlElems) {
      this._appendControlElems(streamId, item, controlElems, this.itemControlType);
    }

    this.rearrange();
    return item;
  },

  _appendControlElems: function(streamId, main, controlElems, itemControlType) {
    var self = this;
    Object.keys(controlElems).forEach(function(controlName) {
      var control = controlElems[controlName];
      var item =
        HTMLElems.createElementAt(main, 'i',
                                  {
                                    'data-icon': control.dataIcon,
                                    'data-eventName': control.eventFiredName,
                                    'data-controlName': controlName,
                                    'data-streamId': streamId
                                  });

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
//  this.itemControlType = 'button';
  this.itemControlType = 'i';
};

Grid.prototype = {
  __proto__: Layout.prototype,

  _VERTICAL_PADDING: 0.2,

  _HORIZONTAL_PADDING: 0.6,

  append: function(streamId, controlElems) {
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
