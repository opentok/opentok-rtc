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

  var init = function (useGoogleApi) {
    var dependencyLibs = [];

    if(aParams.useGoogleApi)
      dependencyLibs.push('//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js');
    else
      dependencyLibs.push('//static.opentok.com/js/vendor/jquery-1.11.1.min.js');

    dependencyLibs.push('//cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/intlTelInput.js');
    dependencyLibs.push('//cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/utils.js');

    LazyLoader.dependencyLoad(dependencyLibs).then(function () {
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
