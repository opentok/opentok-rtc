/* global LandingView, PrecallController, OTHelper */

!(function (global) {
  'use strict';

  var init = function () {
    LazyLoader.dependencyLoad([
      '/js/vendor/ejs_production.js',
      '/js/helpers/ejsTemplate.js',
      '/js/landingView.js',
      '/js/precallView.js',
      '/js/precallController.js',
      '/js/helpers/OTHelper.js'
    ]).then(function () {
      LandingView.init();
      var otHelper = new OTHelper({});
      PrecallController.showCallSettingsPrompt('', '', otHelper);
    });
  };

  global.LandingController = {
    init: init
  };
}(this));
