/* global LandingView, PrecallController, PrecallView, OTHelper */

!(function (global) {
  'use strict';

  var addEventHandlers = function () {
    Utils.addEventsHandlers('precallView:', { submit: function () {
      // Jeff to do: submit form data (camera ID, mic ID, user name)
      window.location = '/room/' + window.roomName;
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
