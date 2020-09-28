/* global Grid, Float, F2FHorizontal, F2FVertical, HangoutHorizontal, HangoutVertical, LayoutView,
LayoutViewport, ItemsHandler */

!(function (global) {
  'use strict';

  var userLayout = null;
  var currentLayout = null;
  var container = null;

  var items = {};

  var layouts;
  var lcache = window.localStorage;
  var HANGOUT_BY_DEFAULT = 'hangout_vertical';

  function isOnGoing(layout) {
    return Object.getPrototypeOf(currentLayout) === layout.prototype;
  }

  var handlers = {
    layout: function (evt) {
      userLayout = evt.detail.type;
      lcache.setItem('opentokrtc-layout', userLayout);
      rearrange();
    },
    itemSelected: function (evt) {
      if (isGroup() && isOnGoing(Grid)) {
        userLayout = HANGOUT_BY_DEFAULT;
        rearrange(evt.detail.item);
      }
    },
    emptyStage: function () {
      userLayout = 'grid';
      rearrange();
    }
  };

  function getDeviceLayout(isScreen = false) {
    if (window.matchMedia('screen and (min-device-width : 320px) and (max-device-width : 1024px) and (orientation : landscape)').matches) {
      return isScreen ? 'hangout_vertical' : 'f2f_vertical';
    } else if (window.matchMedia('screen and (max-width: 480px) and (orientation : portrait)').matches) {
      return isScreen ? 'hangout_horizontal' : 'f2f_horizontal';
    }
    var userSelectedLayout = null;
    if (userLayout !== lcache.getItem('opentokrtc-default')) {
      // not mobile
      userSelectedLayout = lcache.getItem('opentokrtc-default');
    }
    return isScreen ? HANGOUT_BY_DEFAULT : userSelectedLayout;
  }

  function getLayoutByScreenCount(layout , isScreenShared) {
    if (isScreenShared) {
        return layout
    } else {
        return (getTotal() <= 2) ? layout : 'grid';
    }
  }

  function layoutModifier() {
    var isScreenShared = lcache.getItem('opentokrtc-screenshare') != null;
    userLayout = getLayoutByScreenCount(getDeviceLayout(isScreenShared), isScreenShared);
    rearrange();
  }

  function init(selector, enableHangoutScroll) {
    layouts = {
      grid: Grid,
      float: Float,
      f2f_horizontal: F2FHorizontal,
      f2f_vertical: F2FVertical,
      hangout_horizontal: HangoutHorizontal,
      hangout_vertical: HangoutVertical
    };
    container = document.querySelector(selector);
    LayoutView.init(container);
    ItemsHandler.init(container, items);
    Utils.addEventsHandlers('layoutMenuView:', handlers, global);
    Utils.addEventsHandlers('layoutView:', handlers, global);
    Utils.addEventsHandlers('hangout:', handlers, global);
    lcache.setItem('opentokrtc-default', userLayout);
    var smartphonePortrait = window.matchMedia('screen and (max-width: 480px) and (orientation : portrait)');
    if (smartphonePortrait.matches) {
      layoutModifier(smartphonePortrait);
    }
    smartphonePortrait.addListener(layoutModifier);

    return enableHangoutScroll ? LazyLoader.load([
      '/js/layoutViewport.js', '/css/hangoutScroll.css'
    ]).then(function() {
      LayoutViewport.init(container.querySelector('.tc-list ul'), '.stream');
    }) : Promise.resolve();
  }

  function isHangoutRequired(item) {
    // New screen shared and 3 or more items implies going to hangout if this isn't our current
    // layout running
    return Utils.isScreen(item) && isGroup() &&
           !(isOnGoing(HangoutHorizontal) || isOnGoing(HangoutVertical));
  }

  function append(id, options) {
    var item = LayoutView.append(id, options);
    items[id] = item;
    if (isHangoutRequired(item)) {
      userLayout = getDeviceLayout(true);
      lcache.setItem('opentokrtc-screenshare', id);
      rearrange(item);
    } else {
      rearrange();
    }
    Utils.sendEvent('layoutManager:itemAdded', {
       item: item
    });
    return item.querySelector('.opentok-stream-container');
  }

  function remove(id) {
    var item = items[id];
    if (!item) {
      return;
    }

    if (id === lcache.getItem('opentokrtc-screenshare')) {
      lcache.removeItem('opentokrtc-screenshare');
    }

    LayoutView.remove(item);
    delete items[id];
    Utils.sendEvent('layoutManager:itemDeleted', {
      item: item
    });
    layoutModifier();
  }

  function removeAll() {
    LayoutView.removeAll();
  }

  function getItemById(aId) {
    return items[aId];
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

  function rearrange(item) {
    var CandidateLayout = calculateCandidateLayout();

    if (!currentLayout || !isOnGoing(CandidateLayout)) {
      currentLayout && currentLayout.destroy();
      currentLayout = new CandidateLayout(container, items, item);
      Utils.sendEvent('layoutManager:layoutChanged');
    }

    currentLayout.rearrange();
    updateAvailableLayouts();
  }

  global.LayoutManager = {
    init: init,
    append: append,
    remove: remove,
    removeAll: removeAll,
    getItemById: getItemById
  };
}(this));
