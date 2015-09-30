!function(global) {
  'use strict';

  var init = function() {
    LazyLoader.dependencyLoad([
      '/js/components/htmlElems.js',
      '/js/helpers/OTHelper.js',
      '/js/roomView.js',
      '/js/chatController.js'
    ]).then(function () {
      LandingView.init();
    });
  };


  global.LandingController = {
    init: init
  };

}(this);
