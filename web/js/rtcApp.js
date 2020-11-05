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
      RoomController.init();
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
