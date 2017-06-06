!(function(global) {
  'use strict';

  var init = function() {
    LazyLoader.dependencyLoad([
      '/js/landingView.js'
    ]).then(function() {
      LandingView.init();
    });
  };

  global.LandingController = {
    init: init
  };
}(this));
