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
      'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/intlTelInput.js',
      'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/utils.js'
    ]).then(function () {
      input = $('#dialOutNumber');
      input.intlTelInput({
        utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/utils.js',
        initialCountry: 'US',
        separateDialCode: true
      });
    });
    addHandlers();
  };

  global.PhoneNumberView = {
    init: init
  };
}(this));
