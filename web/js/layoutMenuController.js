!function(global) {
  'use strict';

  var init = function() {
    LazyLoader.dependencyLoad([
      '/js/layoutMenuView.js'
    ]).then(function () {
      LayoutMenuView.init();
    });
  };

  global.LayoutMenuController = {
    init: init
  };

}(this);
