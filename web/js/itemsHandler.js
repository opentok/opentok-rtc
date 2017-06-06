!(function(global) {
  'use strict';

  var Handler = function(container, items) {
    ['click', 'dblclick'].forEach(function(name) {
      container.addEventListener(name, this);
    }, this);
    var events = ['roomController:video', 'roomController:audio', 'roomController:videoDisabled',
      'roomController:videoEnabled', 'roomController:disconnected',
      'roomController:connected'];
    events.forEach(function(name) {
      window.addEventListener(name, this);
    }, this);
    this.items = items;
  };

  var setVideoDisabled = function(item, disabled) {
    item && item.data('videoDisabled', disabled);
  };

  Handler.prototype = {
    handleEvent: function(evt) {
      switch (evt.type) {
        case 'click':
          var elemClicked = evt.target;
          if (!(HTMLElems.isAction(elemClicked))) {
            return;
          }
          Utils.sendEvent(elemClicked.data('eventName'), {
            streamId: elemClicked.data('streamId'),
            name: elemClicked.data('action'),
            streamType: elemClicked.data('streamType')
          });
          break;

        case 'roomController:video':
        case 'roomController:audio':
          var detail = evt.detail;
          var item = this.items[detail.id];
          if (detail.reason === 'publishVideo' || detail.reason === 'publishAudio') {
            item = this.items.publisher;
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

        case 'roomController:connected':
        case 'roomController:disconnected':
          var item = this.items[evt.detail.id]; // eslint-disable-line no-redeclare
          item && item.data('disconnected', evt.type === 'roomController:disconnected');
          break;

        case 'dblclick':
          var target = evt.target;

          if (target.classList.contains('dblclick_area')) {
            Utils.sendEvent('layoutView:itemSelected', {
              item: this.items[target.data('id')]
            });
          }
          break;
      }
    }
  };
  function init(container, items) {
    return new Handler(container, items);
  }

  global.ItemsHandler = {
    init: init
  };
}(this));
