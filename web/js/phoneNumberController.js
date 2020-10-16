/* global PhoneNumberView */
!(global => {
  const init = () => {
    return LazyLoader.load(
      '/js/min/phoneNumberView.min.js'
    ).then(() => {
      PhoneNumberView.init();
    });
  };

  global.PhoneNumberController = {
    init
  };
})(this);
