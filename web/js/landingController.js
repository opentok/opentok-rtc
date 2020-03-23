/* global LandingView, Utils */

!(function (global) {
  'use strict';

  var init = function () {
    Utils.verifyToken();
    LazyLoader.dependencyLoad([
      '/js/vendor/ejs_production.js',
      '/js/helpers/ejsTemplate.js',
      '/js/landingView.js'
    ]).then(function () {
      var redirectUrl = Utils.getCookie('prev_url');
      if (redirectUrl && redirectUrl !== window.location.href) {
        window.location.href = redirectUrl;
      }
      LandingView.init();
    });
  };

  global.LandingController = {
    init: init
  };
}(this));
