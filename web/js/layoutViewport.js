!(function(exports) {
  'use strict';

  var container,
    itemSelector,
    scrollTimer,
    delay = 100;

  function visitItems() {
    var items = container.querySelectorAll(itemSelector);
    var total = items.length;

    if (total === 0) {
      return;
    }

    var viewTop = container.scrollTop;
    var containerHeight = container.offsetHeight;

    var viewLeft = container.scrollLeft;
    var containerWidth = container.offsetWidth;

    for (var i = 0; i < total; i++) {
      var item = items[i];
      if (item) {
        var visibility = 'hidden';

        if (item.classList.contains('on-stage')) {
          visibility = 'visible';
        } else {
          var itemHeight = item.offsetHeight;
          var itemWidth = item.offsetWidth;
          var itemOffsetTop = item.offsetTop;
          var itemOffsetLeft = item.offsetLeft;
          if (((itemOffsetTop >= viewTop &&
               itemOffsetTop <= viewTop + containerHeight) ||
              (itemOffsetTop + itemHeight >= viewTop &&
               itemOffsetTop + itemHeight <= viewTop + containerHeight)) &&

              ((itemOffsetLeft >= viewLeft &&
               itemOffsetLeft <= viewLeft + containerWidth) ||
              (itemOffsetLeft + itemWidth >= viewLeft &&
               itemOffsetLeft + itemWidth <= viewLeft + containerWidth))) {
            visibility = 'visible';
          }
        }

        Utils.sendEvent('roomView:streamVisibilityChange', {
          id: item.data('id'),
          value: visibility
        });
      }
    }
  }

  function onVisitItems() {
    scrollTimer && exports.clearTimeout(scrollTimer);
    scrollTimer = exports.setTimeout(visitItems, delay);
  }

  var handlers = {
    itemAdded: onVisitItems,
    itemDeleted: onVisitItems,
    resize: onVisitItems,
    layoutChanged: onVisitItems,
    scroll: onVisitItems
  };

  function init(pContainer, pItemSelector) {
    container = pContainer;
    itemSelector = pItemSelector;
    container.addEventListener('scroll', handlers.scroll);
    exports.addEventListener('resize', handlers.resize);
    Utils.addEventsHandlers('layoutManager:', handlers, exports);
  }

  exports.LayoutViewport = {
    init: init
  };
}(this));
