/* global PhoneNumberView */
!((global) => {
  const init = () => LazyLoader.load(
    '/js/min/phoneNumberView.min.js',
  ).then(() => {
    PhoneNumberView.init();
  });

  global.PhoneNumberController = {
    init,
  };
})(this);
