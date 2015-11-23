'use strict';

var LayoutBase = function(container, items, type) {
  this.items = items;
  this.container = container;
  container.dataset.currentLayoutType = type;
};

LayoutBase.prototype = {
  rearrange: function() {
    var features = this.features;
    Object.keys(this.items).forEach(function(id) {
      var style = this.items[id].style;
      Object.keys(features).forEach(function(feature) {
        style[feature] = features[feature];
      });
    }, this);
    return this;
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
      width: (100 / columns) + '%',
      height: (100 / Math.ceil(total / columns)) + '%'
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
      width: '100%',
      height: (100 / this.total) + '%'
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
      width: (100 / this.total) + '%',
      height: '100%',
    };
  }
};

var Hangout = function(container, items, item, type) {
  LayoutBase.call(this, container, items, type);
  Object.keys(this.handlers).forEach(function(type) {
    window.addEventListener(type, this);
  }, this);

  this.sanitize(!!item);

  if (item) {
    this.putItemOnStage(item);
  } else if (!this.totalOnStage) {
    this.putItemOnStage(this.getRandomItem());
  }

  this.updateTotalOnStage();
};

/*
 * It returns the data attribute where the id will be stored depending on type
 *
 * @param type - camera or screen
 */
Hangout.getAttributeName = function(type) {
  return 'onStage' + type.charAt(0).toUpperCase() + type.slice(1);
};

/*
 * It returns the type of item which is used to index internally
 *
 * @param item - item object
 */
Hangout.getItemType = function(item) {
  return item.dataset.streamType === 'camera' ? 'camera' : 'screen';
};

/*
 * It returns the id of item received as param
 *
 * @param item - item object
 */
Hangout.getItemId = function(item) {
  return item.dataset.id;
};

/*
 * It returns an array of objects for each event with type and attribute name
 */
Hangout.stageTypeDescriptors = ['camera', 'screen'].map(function(aType) {
  return {
    type: aType,
    attrName: Hangout.getAttributeName(aType)
  };
});

Hangout.prototype = {
  __proto__: LayoutBase.prototype,

  handlers: {
    'layoutView:itemSelected': function(evt) {
      var item = evt.detail.item;
      if (this.isOnStage(item)) {
        // Selected item is already on stage so it should be expanded to cover all. That means that
        // the other item on stage should go to the strip leaving the stage
        this.removeCurrentItemFromStage(
          Hangout.getItemType(item) === 'camera' ? 'screen' : 'camera'
        );
      } else {
        this.putItemOnStage(item);
      }
      this.updateTotalOnStage();
    },
    'layoutManager:itemDeleted': function(evt) {
      var item = evt.detail.item;
      if (this.isOnStage(item)) {
        this.removeItemFromStage(item).updateTotalOnStage();
        !this.totalOnStage && Utils.sendEvent('hangout:emptyStage');
      }
    },
    'layoutManager:itemAdded': function(evt) {
      var item = evt.detail.item;
      // New screen shared goes to stage if there is not another screen shared there
      if (Hangout.getItemType(item) === 'screen' && !this.stageIds['screen']) {
        this.putItemOnStage(item).updateTotalOnStage();
      }
    }
  },

  handleEvent: function(evt) {
    this.handlers[evt.type].call(this, evt);
  },

  /*
   * It puts an item on stage:
   *
   * 1º) Remove the current item on stage of the same type if it exists and then...
   * 2º) Put the item received as param on the stage
   *
   * @param item - item object
   */
  putItemOnStage: function(item) {
    if (!item) {
      return this;
    }
    this.removeCurrentItemFromStage(Hangout.getItemType(item)).putStageId(item);
    item.classList.add('on-stage');
    return this;
  },

  /*
   * It returns a random item (publisher stream is not included)
   */
  getRandomItem() {
    return this.items[Object.keys(this.items).find(function(id) {
      return id !== 'publisher';
    })];
  },

  /*
   * It removes the current item on stage given a type if this exists
   *
   * @param type - type of item
   */
  removeCurrentItemFromStage: function(type) {
    var item = this.items[this.stageIds[type]];
    return this.removeItemFromStage(item);
  },

  /*
   * It removes the current item on stage given a type if this exists
   *
   * @param item - item object
   */
  removeItemFromStage: function(item) {
    if (item) {
      this.removeStageId(item);
      item.classList.remove('on-stage');
    }
    return this;
  },

  /*
   * It returns true if the item is already on stage
   *
   * @param item - item object
   */
  isOnStage: function(item) {
    return item.classList.contains('on-stage');
  },

  /*
   * This method checks the latest status of the stage in order to be synchronized with current
   * items available in the layout.
   *
   * * @param reset - all previous status will be deleted if this flag is true
   */
  sanitize: function(reset) {
    var sanitizedStageIds = {};
    Array.prototype.forEach.call(this.container.querySelectorAll('.on-stage'), function(elem) {
      elem.classList.remove('on-stage');
    });

    if (!reset) {
      // Checking items previously on stage if they still exist
      var stageIds = this.stageIds;
      Object.keys(stageIds).forEach(function(type) {
        var id = stageIds[type];
        var item = this.items[id];
        if (item) {
          item.classList.add('on-stage');
          sanitizedStageIds[type] = id;
        }
      }, this);
    }

    this.stageIds = sanitizedStageIds;
    return this;
  },

  /*
   * It returns all ids of items on stage
   */
  get stageIds() {
    var ids = {};

    Hangout.stageTypeDescriptors.forEach(function(descriptor) {
      var id = this.container.dataset[descriptor.attrName];
      id && (ids[descriptor.type] = id);
    }, this);

    return ids;
  },

  /*
   * Store all ids of items on stage
   */
  set stageIds(aIds) {
    aIds = aIds || {};

    Hangout.stageTypeDescriptors.forEach(function(descriptor) {
      if (aIds[descriptor.type]) {
        this.container.dataset[descriptor.attrName] = aIds[descriptor.type];
      } else {
        delete this.container.dataset[descriptor.attrName];
      }
    }, this);
  },

  /*
   * It saves an item id on stage
   *
   * @param item - item object
   */
  putStageId: function(item) {
    var ids = this.stageIds;
    ids[Hangout.getItemType(item)] = Hangout.getItemId(item);
    this.stageIds = ids;
    return this;
  },

  /*
   * It removes an item id on stage
   *
   * @param item - item object
   */
  removeStageId: function(item) {
    var ids = this.stageIds;
    delete ids[Hangout.getItemType(item)];
    this.stageIds = ids;
    return this;
  },

  /*
   * It updates the flag that contains the total number of items on stage in order to update the UI
   */
  updateTotalOnStage: function() {
    this.container.dataset.totalOnStage = this.totalOnStage;
    return this.rearrange();
  },

  /*
   * It returns the total number of items rendered on the stage
   */
  get totalOnStage() {
    return Object.keys(this.stageIds).length;
  },

  /*
   * It returns the total number of items rendered on the strip
   */
  get totalOnStrip() {
    return this.total - this.totalOnStage;
  },

  destroy: function() {
    Object.keys(this.handlers).forEach(function(name) {
      window.removeEventListener(name, this);
    }, this);
    LayoutBase.prototype.destroy.apply(this, arguments);
  }
};

var HangoutHorizontal = function(container, items, streamSelectedId) {
  Hangout.call(this, container, items, streamSelectedId, 'hangout_horizontal');
};

HangoutHorizontal.prototype = {
  __proto__: Hangout.prototype,

  get features() {
    return {
      width: (100 / this.totalOnStrip) + '%',
      height: '100%'
    };
  }
};

var HangoutVertical = function(container, items, streamSelectedId) {
  Hangout.call(this, container, items, streamSelectedId, 'hangout_vertical');
};

HangoutVertical.prototype = {
  __proto__: Hangout.prototype,

  get features() {
    return {
      width: '100%',
      height: (100 / this.totalOnStrip) + '%'
    };
  }
};
