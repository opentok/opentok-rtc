!function(exports) {
  'use strict';

  var signUp, createMeeting;

  var init = function() {
    signUp = document.getElementById('signUp');
    createMeeting = document.getElementById('createMeeting');
    addHandlers();
  };

  var addHandlers = function() {
    signUp.addEventListener('click', function onEnterClicked(event) {
      event.preventDefault();
      window.location.href = 'https://tokbox.com/account/user/signup';
    });
    createMeeting.addEventListener('click', function onEnterClicked(event) {
      event.preventDefault();
      window.location.href = '/';
    });
  };

  exports.DoneView = {
    init: init
  };

}(this);
