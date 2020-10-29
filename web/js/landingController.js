/* global LandingView, PrecallController, PrecallView, OTHelper */

!((global) => {
  const addEventHandlers = () => {
    Utils.addEventsHandlers('precallView:', {
      submit() {
        const createInput = (prop, value) => {
          const input = document.createElement('input');
          input.setAttribute('name', prop);
          input.setAttribute('value', value);
          input.setAttribute('type', 'hidden');
          return input;
        };

        const form = document.querySelector('.main form');
        const roomNameTextInput = (document.getElementById('room-name-input') || {}).value;
        const roomName = roomNameTextInput || window.roomName;
        form.action = `/room/${roomName}`;
        const publishVideo = document.querySelector('.user-name-modal #initialVideoSwitch label').textContent === 'On';
        const publishAudio = document.querySelector('.user-name-modal #initialAudioSwitch label').textContent === 'On';
        form.appendChild(createInput('publishVideo', publishVideo));
        form.appendChild(createInput('publishAudio', publishAudio));
        form.submit();
      },
    });
  };

  const init = () => {
    LazyLoader.dependencyLoad([
      '/js/components/htmlElems.js',
      '/js/vendor/ejs_production.js',
      '/js/helpers/ejsTemplate.js',
      '/js/landingView.js',
      '/js/min/precallView.min.js',
      '/js/min/precallController.min.js',
      '/js/helpers/OTHelper.js',
    ]).then(() => LandingView.init()).then(() => PrecallView.init()).then(() => {
      const otHelper = new OTHelper({});
      PrecallController.showCallSettingsPrompt('', '', otHelper);
      addEventHandlers();
    });
  };

  global.LandingController = {
    init,
  };
})(this);
