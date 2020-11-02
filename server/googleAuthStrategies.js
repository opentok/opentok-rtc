const { OAuth2Client } = require('google-auth-library');

/* eslint-disable class-methods-use-this */
class DisabledGoogleAuthStategy {
  constructor() {
    return this;
  }

  verifyIdToken() {
    return Promise.resolve();
  }
}
/* eslint-disable class-methods-use-this */

class EnabledGoogleAuthStrategy {
  constructor(googleId, hostedDomain) {
    this.googleId = googleId;
    this.hostedDomain = hostedDomain;
    this.client = new OAuth2Client(googleId, '', '');
  }

  verifyIdToken(token) {
    return new Promise((resolve, reject) => {
      this.client.verifyIdToken({
        idToken: token,
        audience: this.googleId,
      })
        .then((login) => {
          const payload = login.getPayload();
          if (this.hostedDomain && (this.hostedDomain !== payload.hd)) {
            reject(new Error('Authentication Domain Does Not Match'));
          }
          resolve();
        })
        .catch((err) => reject(err));
    });
  }
}

module.exports = {
  DisabledGoogleAuthStategy,
  EnabledGoogleAuthStrategy,
};
