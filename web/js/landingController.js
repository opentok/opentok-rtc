/* global LandingView */

!(function (global) {
  'use strict';

  var init = function () {
    LazyLoader.dependencyLoad([
      '/js/vendor/ejs_production.js',
      '/js/helpers/ejsTemplate.js',
      '/js/landingView.js'
    ]).then(function () {
      LandingView.init();
    });
  };

  global.LandingController = {
    init: init
  };
}(this));
