'use strict';

var LayoutBase = function(container, items, type) {
  this.items = items;
  this.container = container;
  container.dataset.currentLayoutType = type;
};

LayoutBase.prototype = {
  _PADDING: 0.5,

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
      width: ((100 / columns) - this._PADDING) + '%',
      height: ((100 / Math.ceil(total / columns)) - this._PADDING) + '%'
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
      width: (100 - this._PADDING) + '%',
      height: ((100 / this.total) - this._PADDING) + '%'
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
      width: ((100 / this.total) - this._PADDING) + '%',
      height: (100 - this._PADDING) + '%',
    };
  }
};

var Hangout = function(container, items, streamSelectedId, type) {
  LayoutBase.call(this, container, items, type);
  Object.keys(this.handlers).forEach(function(type) {
    window.addEventListener(type, this);
  }, this);
  this.putOnStage(streamSelectedId || this.onStageStreamId);
};

Hangout.prototype = {
  __proto__: LayoutBase.prototype,

  handlers: {
    'layoutView:streamSelected': function(evt) {
      this.putOnStage(evt.detail.streamId);
    },
    'layoutManager:streamDeleted': function(evt) {
      if (this.onStageStreamId === evt.detail.streamId) {
        // Stream on stage was deleted so putting another random one
        this.putOnStage(this.getRandomStreamId());
      }
    }
  },

  handleEvent: function(evt) {
    this.handlers[evt.type].call(this, evt);
  },

  /*
   * It puts a stream on stage. If third parties do not provide id as param or the stream
   * is not available, the layout puts a random stream different than publisher on stage.
   *
   * @param id - Stream id
   */
  putOnStage: function(id) {
    var stream = this.items[id];
    if (!stream) {
      id = this.getRandomStreamId();
      stream = this.items[id];
    }

    this.removeCurrentStreamFromStage().addStreamToStage(id, stream);
  },

  /*
   * It returns a random stream id (publisher stream is not included)
   */
  getRandomStreamId() {
    return Object.keys(this.items).find(function(id) {
      return id !== 'publisher';
    });
  },

  /*
   * It adds a stream to stage
   *
   * @param id - Stream id
   * @param stream - Stream object
   */
  addStreamToStage(id, stream) {
    this.onStageStreamId = id;
    stream.classList.add('on-stage');
    return this;
  },

  /*
   * It removes the current stream on stage
   */
  removeCurrentStreamFromStage() {
    var previousOnStageStream = this.items[this.onStageStreamId];
    if (previousOnStageStream) {
      this.onStageStreamId = null;
      previousOnStageStream.classList.remove('on-stage');
    }
    return this;
  },

  /*
   * It returns the current stream id on stage
   */
  get onStageStreamId() {
    return this.container.dataset.onStageStreamId;
  },

  /*
   * It holds the current stream id on stage
   */
  set onStageStreamId(id) {
    this.container.dataset.onStageStreamId = id;
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
      width: ((100 / (this.total - 1)) - this._PADDING / 2) + '%',
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
      height: ((100 / (this.total - 1)) - this._PADDING / 2) + '%'
    };
  }
};
