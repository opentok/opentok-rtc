/* global $ */
!(global => {
  let input;

  const sendPhoneNumber = () => {
    const phoneNumber = input.intlTelInput('getNumber');
    Utils.sendEvent('phoneNumberView:dialOut', phoneNumber);
  };

  const eventHandlers = {
    verifyDialOut: sendPhoneNumber
  };

  const addHandlers = () => {
    Utils.addEventsHandlers('roomView:', eventHandlers, global);
  };

  const init = () => {
    LazyLoader.dependencyLoad([
      'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/intlTelInput.js',
      'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.0/js/utils.js'
    ]).then(() => {
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
    init
  };
})(this);
