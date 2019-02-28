/* global PhoneNumberView */
!(function (global) {
  var init = function (useGoogleApi) {
    return LazyLoader.load(
      '/js/phoneNumberView.js'
    ).then(function () {
      PhoneNumberView.init(useGoogleApi);
    });
  };

  global.PhoneNumberController = {
    init: init
  };
}(this));
