
'use strict';

var Layout = function(selector) {
  this.container = document.querySelector(selector);
};

Layout.prototype = {
  append: function(id) {
    var item = HTMLElems.createElementAt(this.container, this.itemType);
    item.dataset.id = id;
    this.rearrange();
    return item;
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
};

Grid.prototype = {
  __proto__: Layout.prototype,

  append: function(id) {
    var item = Layout.prototype.append.apply(this, arguments);
    // Streams go inside <span> because of OpenTok overrides <li> styles if this
    // one would be the container.
    return HTMLElems.createElementAt(item, 'span');
  },

  features: function() {
    var total = this.container.children.length;
    var columns = Math.ceil(Math.sqrt(total));

    return {
      width: (100 / columns) + '%',
      height: (100 / Math.ceil(total / columns)) + '%'
    };
  }
};
