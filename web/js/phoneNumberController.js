/* global PhoneNumberView */
!(function (global) {
  var init = function (jqueryUrl) {
    return LazyLoader.load(
      '/js/phoneNumberView.js'
    ).then(function () {
      PhoneNumberView.init(jqueryUrl);
    });
  };

  global.PhoneNumberController = {
    init: init
  };
}(this));
