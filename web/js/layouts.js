'use strict';

var LayoutBase = function(container, items, type) {
  this.items = items;
  this.container = container;
  container.dataset.currentLayoutType = type;
};

LayoutBase.prototype = {
  _VERTICAL_PADDING: 0.2,

  _HORIZONTAL_PADDING: 0.6,

  rearrange: function() {
    var features = this.features;
    Object.keys(this.items).forEach(function(id) {
      var style = this.items[id].style;
      Object.keys(features).forEach(function(feature) {
        style[feature] = features[feature];
      });
    }, this);
  },

  get features() {
    return {};
  },

  get total() {
    return Object.keys(this.items).length;
  },

  destroy: function() {
    this.container = null;
  }
};

var Grid = function(container, items) {
  LayoutBase.call(this, container, items, 'grid');
};

Grid.prototype = {
  __proto__: LayoutBase.prototype,

  get features() {
    var total = this.total;
    var columns = Math.ceil(Math.sqrt(total));

    return {
      width: ((100 / columns) - this._HORIZONTAL_PADDING) + '%',
      height: ((100 / Math.ceil(total / columns)) - this._VERTICAL_PADDING) + '%'
    };
  }
};

var Float = function(container, items) {
  LayoutBase.call(this, container, items, 'float');
  this.addDraggableFeature();
};

Float.prototype = {
  __proto__: LayoutBase.prototype,

  get features() {
    return {
      width: '100%',
      height: '100%'
    };
  },

  get publisher() {
    return this.items['publisher'];
  },

  addDraggableFeature: function() {
    if (this.addedDraggableFeature || !this.publisher) {
      return;
    }

    this.addedDraggableFeature = true;
    Utils.getDraggable().then(function(draggable) {
      draggable.on(this.publisher);
    }.bind(this));
  },

  rearrange: function() {
    LayoutBase.prototype.rearrange.apply(this, arguments);
    this.addDraggableFeature();
  },

  destroy: function() {
    Utils.getDraggable().then(function(draggable) {
      draggable.off(this.publisher);
      LayoutBase.prototype.destroy.apply(this, arguments);
    }.bind(this));
  }
};

var F2FHorizontal = function(container, items) {
  LayoutBase.call(this, container, items, 'f2f_horizontal');
};

F2FHorizontal.prototype = {
  __proto__: LayoutBase.prototype,

  get features() {
    return {
      width: (100 - this._HORIZONTAL_PADDING) + '%',
      height: ((100 / this.total) - this._VERTICAL_PADDING) + '%'
    };
  }
};

var F2FVertical = function(container, items) {
  LayoutBase.call(this, container, items, 'f2f_vertical');
};

F2FVertical.prototype = {
  __proto__: LayoutBase.prototype,

  get features() {
    return {
      width: ((100 / this.total) - this._HORIZONTAL_PADDING) + '%',
      height: (100 - this._VERTICAL_PADDING) + '%',
    };
  }
};
