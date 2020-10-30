/* global LayoutMenuView */

!((global) => {
  const init = () => LazyLoader.dependencyLoad([
    '/js/layoutMenuView.js',
  ]).then(() => LayoutMenuView.init());

  global.LayoutMenuController = {
    init,
  };
})(this);
