/* global PhoneNumberView */
!(function (global) {
  var init = function () {
    return LazyLoader.load(
      '/js/phoneNumberView.js'
    ).then(function () {
      PhoneNumberView.init();
    });
  };

  global.PhoneNumberController = {
    init: init
  };
}(this));
