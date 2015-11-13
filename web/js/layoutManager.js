
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
    'f2f_vertical': F2FVertical,
    'hangout_horizontal': HangoutHorizontal,
    'hangout_vertical': HangoutVertical
  };

  var handlers = {
    'layout': function(evt) {
      userLayout = evt.detail.type;
      rearrange();
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
    var candidateLayout = null;

    if (getTotal() > 2) {
      candidateLayout = GRP_LAYOUTS[userLayout] ? layouts[userLayout] : Grid;
    } else {
      candidateLayout = F2F_LAYOUTS[userLayout] ? layouts[userLayout] : Float;
    }

    return candidateLayout;
  }

  var F2F_LAYOUTS = {
    float: true,
    f2f_horizontal: true,
    f2f_vertical: true
  };

  var GRP_LAYOUTS = {
    grid: true,
    hangout_horizontal: true,
    hangout_vertical: true
  };

  function isGroup() {
    return getTotal() > 2;
  }

  function updateAvailableLayouts() {
    Utils.sendEvent('layoutManager:availableLayouts', {
      layouts: isGroup() ? GRP_LAYOUTS : F2F_LAYOUTS
    });
  }

  function rearrange() {
    var candidateLayout = calculateCandidateLayout();

    if (!currentLayout || Object.getPrototypeOf(currentLayout) !== candidateLayout.prototype) {
      currentLayout && currentLayout.destroy();
      currentLayout = new candidateLayout(container, items);
    }

    currentLayout.rearrange();
    updateAvailableLayouts();
  }

  global.LayoutManager = {
    init: init,
    append: append,
    remove: remove
  };

}(this);
