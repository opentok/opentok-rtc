!function(exports) {
  'use strict';

  var menuSelector = '[for="chooseLayout"] ul';

  var addHandlers = function() {
    document.querySelector(menuSelector).addEventListener('click', function(evt) {
      var type = evt.target.dataset.layoutType;
      if (type) {
        BubbleFactory.get('chooseLayout').toggle();
        Utils.sendEvent('layoutMenuView:layout', {
          type: type
        });
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
