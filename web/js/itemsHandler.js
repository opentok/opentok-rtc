!function(global) {
  'use strict';

  var Handler = function(container, items) {
    ['click', 'dblclick'].forEach(function(name) {
      container.addEventListener(name, this);
    }, this);
    var events = ['roomController:video', 'roomController:audio', 'roomController:videoDisabled',
                  'roomController:videoEnabled'];
    events.forEach(function(name) {
      window.addEventListener(name, this);
    }, this);
    this.items = items;
  };

  var setVideoDisabled = function(item, disabled) {
    item && (item.dataset.videoDisabled = disabled);
  };

  Handler.prototype = {
    handleEvent: function(evt) {
      switch (evt.type) {
        case 'click':
          var elemClicked = evt.target;
          if (!(HTMLElems.isAction(elemClicked))) {
            return;
          }
          var dataset = elemClicked.dataset;
          Utils.sendEvent(dataset.eventName, {
            streamId: dataset.streamId,
            name: dataset.action,
            streamType: dataset.streamType
          });
          break;

        case 'roomController:video':
        case 'roomController:audio':
          var detail = evt.detail;
          var item = this.items[detail.id];
          if (detail.reason === 'publishVideo' || detail.reason === 'publishAudio') {
            item = this.items['publisher'];
          }

          if (!item) {
            return;
          }

          var action = evt.type.replace('roomController:', '');
          HTMLElems.setEnabled(item.querySelector('.' + action + '-action'), detail.enabled);
          action === 'video' && setVideoDisabled(item, !detail.enabled);
          break;

        case 'roomController:videoDisabled':
        case 'roomController:videoEnabled':
          setVideoDisabled(this.items[evt.detail.id], evt.type === 'roomController:videoDisabled');
          break;

        case 'dblclick':
          var target = evt.target;

          if (target.classList.contains('dblclick_area')) {
            Utils.sendEvent('layoutView:itemSelected', {
              item: this.items[target.dataset.id]
            });
          }
          break;
      }
    }
  };

  function init(container, items) {
    var handler = new Handler(container, items);
  }

  global.ItemsHandler = {
    init: init
  };

}(this);
