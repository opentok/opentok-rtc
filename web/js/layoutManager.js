
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

  function init(selector) {
    container = document.querySelector(selector);
    LayoutView.init(container);
    ItemsHandler.init(container, items);
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
    var candiateLayout = Float;
    var total = getTotal();

    if (total > 2) {
      candiateLayout = Grid;
    } else if ((total === 2) && (userLayout && userLayout !== Grid)) {
      candiateLayout = userLayout;
    }

    return candiateLayout;
  }

  function rearrange() {
    var candiateLayout = calculateCandidateLayout();

    if (!currentLayout || layouts[currentLayout.type] !== candiateLayout) {
      currentLayout && currentLayout.destroy();
      currentLayout = new candiateLayout(container, items);
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
