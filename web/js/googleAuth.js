!(function(exports) {
  var init = function(clientId, hostedDomain, callback) {
    LazyLoader.dependencyLoad([
      'https://apis.google.com/js/api.js'
    ]).then(function() {
      gapi.load('auth2', function() {
        options = {
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
    init: init
  };
}(this));
