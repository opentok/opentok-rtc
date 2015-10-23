!function(exports) {
  'use strict';

  var DESKTOP_DIV_ID = 'desktop';
  var container = null;

  var viewEventHandlers = {
    'sharingScreenError': remove
  };

  function init() {
    Utils.addEventsHandlers('screenSharingController:', viewEventHandlers, exports);
    container = document.querySelector('.' + DESKTOP_DIV_ID);
  };

  function remove() {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  exports.ScreenSharingView = {
    desktopId: DESKTOP_DIV_ID,
    remove: remove,
    init: init
  };

}(this);
