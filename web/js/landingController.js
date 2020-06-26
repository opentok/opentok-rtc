/* global LandingView, PrecallController, PrecallView, OTHelper */

!(function (global) {
  'use strict';

  var addEventHandlers = function () {
    Utils.addEventsHandlers('precallView:', { submit: function () {
      var form = document.querySelector('.main form');
      form.action = '/room/' + window.roomName;
      form.submit();
    } });
  };

  var init = function () {
    LazyLoader.dependencyLoad([
      '/js/components/htmlElems.js',
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
      PrecallView.init();
      addEventHandlers();
    });
  };

  global.LandingController = {
    init: init
  };
}(this));
