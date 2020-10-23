'use strict';

const { GoogleAuth, OAuth2Client } = require('google-auth-library');
const Utils = require('swagger-boilerplate').Utils;

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
    this.auth = new GoogleAuth; // eslint-disable-line new-parens
    this.client = new OAuth2Client(googleId, '', '');
    this.verifyIdTokenPromise = Utils.promisify(this.client.verifyIdToken, 1, this.client);
  }

  verifyIdToken(token) {
    return new Promise((resolve, reject) => {
      this.verifyIdTokenPromise(token, this.googleId)
        .then((login) => {
          const payload = login.getPayload();
          if (this.hostedDomain && (this.hostedDomain !== payload.hd)) {
            reject(new Error('Authentication Domain Does Not Match'));
          }
          resolve();
        })
        .catch(err => reject(err));
    });
  }
}

module.exports = {
  DisabledGoogleAuthStategy,
  EnabledGoogleAuthStrategy
};
