/* global $ */
!(function (global) {
  var input;

  var sendPhoneNumber = function () {
    var phoneNumber = input.intlTelInput('getNumber');
    Utils.sendEvent('phoneNumberView:dialOut', phoneNumber);
  };

  var eventHandlers = {
    verifyDialOut: sendPhoneNumber
  };

  var addHandlers = function () {
    Utils.addEventsHandlers('roomView:', eventHandlers, global);
  };

  var init = function () {
    LazyLoader.dependencyLoad([
      '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js',
      '/js/vendor/itnl-tel-input/intlTelInput.js',
      '/js/vendor/itnl-tel-input/utils.js'
    ]).then(function () {
      input = $('#dialOutNumber');
      input.intlTelInput({
        utilsScript: '/js/vendor/itnl-tel-input/utils.js',
        initialCountry: 'US'
      });
    });
    addHandlers();
  };

  global.PhoneNumberView = {
    init: init
  };
}(this));
