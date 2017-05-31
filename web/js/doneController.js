!function(exports) {
  'use strict';

  var init = function() {
    LazyLoader.dependencyLoad([
      '/js/doneView.js'
    ]).then(function () {
      DoneView.init();
    });
  };

  var DoneController = {
    init: init
  };

  exports.DoneController = DoneController;

}(this);
