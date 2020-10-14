/* global PhoneNumberView */
!(global => {
  const init = () => {
    return LazyLoader.load(
      '/js/phoneNumberView.js'
    ).then(() => {
      PhoneNumberView.init();
    });
  };

  global.PhoneNumberController = {
    init
  };
})(this);
