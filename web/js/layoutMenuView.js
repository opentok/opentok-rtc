!(function(exports) {
  'use strict';

  var menu = null;
  var items = null;

  var addHandlers = function() {
    menu.addEventListener('click', function(evt) {
      var type = evt.target.data('layoutType');
      if (type) {
        BubbleFactory.get('chooseLayout').toggle();
        Utils.sendEvent('layoutMenuView:layout', {
          type: type
        });
      }
    });

    window.addEventListener('layoutManager:availableLayouts', function(evt) {
      var availableLayouts = evt.detail.layouts;

      Array.prototype.map.call(items, function(elem) {
        var layoutType = elem.data('layoutType');
        var isAvailable = !!availableLayouts[layoutType];
        elem.disabled = !isAvailable;
        isAvailable ? elem.removeAttribute('disabled') : elem.setAttribute('disabled', 'disabled');
      });
    });
  };

  var init = function() {
    menu = document.querySelector('[for="chooseLayout"] ul');
    items = menu.querySelectorAll('a');
    addHandlers();
  };

  exports.LayoutMenuView = {
    init: init
  };
}(this));
