!(function(global) {
  'use strict';

  var init = function() {
    return LazyLoader.dependencyLoad([
      '/js/layoutMenuView.js'
    ]).then(function() {
      return LayoutMenuView.init();
    });
  };

  global.LayoutMenuController = {
    init: init
  };
}(this));
