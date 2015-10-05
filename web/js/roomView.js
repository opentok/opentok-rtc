!function(exports) {
  'use strict';

  var debug = Utils.debug;

  var PUBLISHER_DIV_ID = 'publisher';

  // HTML elements for the view
  var dock,
      screen,
      handler,
      startChatBtn,
      roomNameElem,
      roomUserElem,
      participantsNumberElem,
      subscribersElem;


  function initHTMLElements() {
    dock = document.getElementById('dock');
    screen = document.getElementById('screen');
    handler = dock.querySelector('#handler');

    startChatBtn = dock.querySelector('#startChat');
    roomNameElem = dock.querySelector('#roomName');
    roomUserElem = dock.querySelector('#userName');
    participantsNumberElem = dock.querySelectorAll('.participants');

    subscribersElem = screen.querySelector('#subscriber');
  }

  var roomNameSuffix = 'Meeting Room';
  var USER_NAME_SUFFIX = '\'s';

  var transEndEventName =
    ('WebkitTransition' in document.documentElement.style) ?
     'webkitTransitionEnd' : 'transitionend';

  function createSubscriberView(order) {
    var subsDiv = HTMLElems.createElementAt(subscribersElem, 'div',
                    {id: 'subscriber_' + order},
                       null, false);
    return subsDiv;
  }

  function toggleChatNotification() {
    if (!ChatView.visible) {
      startChatBtn.classList.add('highlight');
    } else {
      startChatBtn.classList.remove('highlight');
    }
  }

  function getPublisherId() {
    return PUBLISHER_DIV_ID;
  }

  var addHandlers = function() {
    handler.addEventListener('click', function(e) {
      dock.classList.toggle('collapsed');
    });

    var menu = document.querySelector('.menu ul');

    menu.addEventListener('click', function(e) {
      var elem = e.target;
      elem.blur();
      switch (elem.id) {
        case 'addToCall':
          BubbleFactory.get('addToCall').show();
          break;
        case 'startChat':
          ChatView.visible = true;
          toggleChatNotification();
          break;
        case 'endCall':
          RoomView.participantsNumber = 0;
          OTHelper.disconnectFromSession();
          break;
      }
    });
  };

  var getURLtoShare = function() {
    return window.location.origin + window.location.pathname;
  };

  var addClipboardFeature = function() {
    var input = document.querySelector('.bubble[for="addToCall"] input');
    var linkToShare = document.querySelector('#addToCall');
    input.value = linkToShare.dataset.clipboardText = getURLtoShare();
    var zc = new ZeroClipboard(linkToShare);
  };

  var init = function() {
    initHTMLElements();
    addHandlers();
    // Due to security issues, flash cannot access the clipboard unless the
    // action originates from a click with a flash object.
    // That means that we need to have ZeroClipboard loaded and the URL
    // will be copied once users click on link to share the URL.
    // Programmatically, setText() wouldn't work.
    addClipboardFeature();
  };

  exports.RoomView = {
    init: init,
    set roomName(value) {
      HTMLElems.addText(roomNameElem, value);
debug.log("roomNameEleme:"+roomNameElem);
      HTMLElems.createElementAt(roomNameElem, 'p', null, roomNameSuffix,false);
    },
    set userName(value) {
      roomUserElem.textContent = value + USER_NAME_SUFFIX;
    },

    set participantsNumber(value) {
      for (var i = 0, l = participantsNumberElem.length; i < l; i++) {
        HTMLElems.replaceText(participantsNumberElem[i], value);
      }
    },

    createSubscriberView: createSubscriberView,
    publisherId: PUBLISHER_DIV_ID,
    toggleChatNotification: toggleChatNotification
  };

}(this);
