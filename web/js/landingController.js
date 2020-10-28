/* global LandingView, PrecallController, PrecallView, OTHelper */

!(global => {
  const addEventHandlers = () => {
    Utils.addEventsHandlers('precallView:', { submit() {

      const addFormElem = (form, prop, value) => {
        const input = document.createElement('input');
        input.setAttribute('name', prop);
        input.setAttribute('value', value);
        input.setAttribute('type', 'hidden');
        form.appendChild(input);
      }

      const form = document.querySelector('.main form');
      form.action = `/room/${window.roomName}`;
      const boundAddElem = addFormElem.bind(form);

      addFormElem(form, 'publishVideo', document.querySelector(`.user-name-modal #initialVideoSwitch label`).textContent === 'On');
      addFormElem(form, 'publishAudio', document.querySelector(`.user-name-modal #initialAudioSwitch label`).textContent === 'On')
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
