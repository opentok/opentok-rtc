/* global gapi */
!((exports) => {
  const init = (clientId, hostedDomain, callback) => {
    LazyLoader.dependencyLoad([
      'https://apis.google.com/js/api.js'
    ]).then(() => {
      gapi.load('auth2', () => {
        const options = {
          client_id: clientId
        };
        if (hostedDomain) {
          options.hosted_domain = hostedDomain;
        }
        gapi.auth2.init(options).then(callback);
      });
    });
  };

  exports.GoogleAuth = {
    init
  };
})(this);
