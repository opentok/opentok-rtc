/* global RTCApp */

!((exports) => {
  let debug;

  const _views = {
    '/': {
      mainView: 'RoomController',
      dependencies: [
        'RoomController',
      ],
    },
  };

  function getView() {
    const pathViews = Object.keys(_views);
    const numViews = pathViews.length;
    const path = exports.document.location.pathname;
    for (let i = 0; i < numViews; i++) {
      if (path.startsWith(pathViews[i])
        && _views[pathViews[i]]
          .dependencies
          .every((dependency) => !!exports[dependency])) {
        return exports[_views[pathViews[i]].mainView];
      }
    }
    return null;
  }

  function init() {
    debug = new Utils.MultiLevelLogger('rtcApp.js', Utils.MultiLevelLogger.DEFAULT_LEVELS.all);
    const view = getView();
    if (view) {
      view.init();
    } else {
      debug.error(`Couldn't find a view for ${exports.document.location.pathname}`);
    }
  }

  exports.RTCApp = {
    init,
  };
})(this);

this.addEventListener('load', () => {
  // Note that since the server forbids loading the content on an iframe this should not execute.
  // But it doesn't hurt either
  if (window.top !== window.self && !window.iframing_allowed) {
    // If we're being loaded inside an iframe just hijack the top level window and go back to
    // the index page.
    window.top.document.location = '/index.html';
  } else {
    // And setting this on an else because the re-location might fail in some cases
    document.body.classList.remove('forbidden');
    // Check that everything was loaded correctly, or just use LazyLoader here...
    LazyLoader.load([
      '/js/libs/browser_utils.js',
      '/shared/js/utils.js',
      '/js/helpers/requests.js',
      '/js/min/roomController.min.js',
    ]).then(() => {
      RTCApp.init();
    });
  }

  // Allow only https on production
  if (
    document.location.protocol === 'http:'
    && (document.location.hostname.includes('.tokbox.com')
    || document.location.hostname.includes('.vonage.com'))
  ) {
    document.location.href = document.location.href.replace(new RegExp('^http:'), 'https:');
  }
});
