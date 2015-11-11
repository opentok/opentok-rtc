
!function(global) {
  'use strict';

  var userLayout = null;
  var currentLayout = null;
  var container = null;

  var items = {};

  var layouts = {
    'grid': Grid,
    'float': Float,
    'f2f_horizontal': F2FHorizontal,
    'f2f_vertical': F2FVertical
  };

  var handlers = {
    'layout': function(evt) {
      LayoutManager.userLayout = layouts[evt.detail.type];
    }
  };

  function init(selector) {
    container = document.querySelector(selector);
    LayoutView.init(container);
    ItemsHandler.init(container, items);
    Utils.addEventsHandlers('layoutMenuView:', handlers, global);
  }

  function append(id, options) {
    var item = LayoutView.append(id, options);
    items[id] = item;
    rearrange();
    return item.querySelector('.opentok-stream-container');
  }

  function remove(id) {
    var item = items[id];
    if (!item) {
      return;
    }

    LayoutView.remove(item);
    delete items[id];
    rearrange();
  }

  function getTotal() {
    return Object.keys(items).length;
  }

  function calculateCandidateLayout() {
    var candidateLayout = Float;
    var total = getTotal();

    if (total > 2) {
      candidateLayout = Grid;
    } else if ((total === 2) && (userLayout && userLayout !== Grid)) {
      candidateLayout = userLayout;
    }

    return candidateLayout;
  }

  function rearrange() {
    var candidateLayout = calculateCandidateLayout();

    if (!currentLayout || Object.getPrototypeOf(currentLayout) !== candidateLayout.prototype) {
      currentLayout && currentLayout.destroy();
      currentLayout = new candidateLayout(container, items);
    }

    currentLayout.rearrange();
  }

  global.LayoutManager = {
    init: init,
    append: append,
    remove: remove,
    layouts: layouts,
    set userLayout(value) {
      userLayout = value;
      rearrange();
    }
  };

}(this);
