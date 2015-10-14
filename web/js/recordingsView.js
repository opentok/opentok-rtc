!function(exports) {
  'use strict';

  function render(videos) {
    var list = document.querySelector('.videos.tc-list ul');

    list.innerHTML = '';

    var total = 0;
    Object.keys(videos).forEach(function(id) {
      ++total;
      var url = videos[id].url;
      var item = HTMLElems.createElementAt(list, 'li');
      HTMLElems.createElementAt(item, 'a', {
        target: '_blank',
        href: url
      }, url);
    });

    RoomView.recordingsNumber = total;
  }

  var init = function(model) {
    return model.init().then(function() {
      return model.onValue(render);
    });
  };

  exports.RecordingsView = {
    init: init
  };

}(this);
