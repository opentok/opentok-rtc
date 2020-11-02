!((exports) => {
  let container;
  let itemSelector;
  let scrollTimer;
  const delay = 100;

  function visitItems() {
    const items = container.querySelectorAll(itemSelector);
    const total = items.length;

    if (total === 0) {
      return;
    }

    const viewTop = container.scrollTop;
    const containerHeight = container.offsetHeight;

    const viewLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;

    for (let i = 0; i < total; i++) {
      const item = items[i];
      if (item) {
        let visibility = 'hidden';

        if (item.classList.contains('on-stage')) {
          visibility = 'visible';
        } else {
          const itemHeight = item.offsetHeight;
          const itemWidth = item.offsetWidth;
          const itemOffsetTop = item.offsetTop;
          const itemOffsetLeft = item.offsetLeft;
          if (((itemOffsetTop >= viewTop
               && itemOffsetTop <= viewTop + containerHeight)
              || (itemOffsetTop + itemHeight >= viewTop
               && itemOffsetTop + itemHeight <= viewTop + containerHeight))

              && ((itemOffsetLeft >= viewLeft
               && itemOffsetLeft <= viewLeft + containerWidth)
              || (itemOffsetLeft + itemWidth >= viewLeft
               && itemOffsetLeft + itemWidth <= viewLeft + containerWidth))) {
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

  const handlers = {
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
    init
  };
})(this);
