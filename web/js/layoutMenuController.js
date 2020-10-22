/* global LayoutMenuView */

!(global => {
  const init = () => {
    return LazyLoader.dependencyLoad([
      '/js/layoutMenuView.js'
    ]).then(() => {
      return LayoutMenuView.init();
    });
  };

  global.LayoutMenuController = {
    init
  };
})(this);
