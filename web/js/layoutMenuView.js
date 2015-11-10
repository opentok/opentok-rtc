!function(exports) {
  'use strict';

  var menuSelector = '[for="chooseLayout"] ul';

  var addHandlers = function() {
    document.querySelector(menuSelector).addEventListener('click', function(evt) {
      var type = evt.target.dataset.layoutType;
      if (type) {
        BubbleFactory.get('chooseLayout').toggle();
        LayoutManager.userLayout = LayoutManager.layouts[type];
      }
    });
  };

  var init = function() {
    addHandlers();
  };

  exports.LayoutMenuView = {
    init: init
  };

}(this);
