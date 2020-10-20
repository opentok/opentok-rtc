/* global LandingView, PrecallController, PrecallView, OTHelper */

!(global => {
  const addEventHandlers = () => {
    Utils.addEventsHandlers('precallView:', { submit() {
      const form = document.querySelector('.main form');
      form.action = `/room/${window.roomName}`;
      form.submit();
    } });
  };

  const init = () => {
    LazyLoader.dependencyLoad([
      '/js/components/htmlElems.js',
      '/js/vendor/ejs_production.js',
      '/js/helpers/ejsTemplate.js',
      '/js/landingView.js',
      '/js/min/precallView.min.js',
      '/js/min/precallController.min.js',
      '/js/helpers/OTHelper.js'
    ]).then(() => {
      return LandingView.init();
    }).then(() => {
      return PrecallView.init();
    }).then(() => {
      const otHelper = new OTHelper({});
      PrecallController.showCallSettingsPrompt('', '', otHelper);
      addEventHandlers();
    });
  };

  global.LandingController = {
    init
  };
})(this);
