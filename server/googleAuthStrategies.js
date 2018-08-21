'use strict';

var GoogleAuth = require('google-auth-library');
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
  constructor(googleId, hostedDomains) {
    this.googleId = googleId;
    this.hostedDomains = hostedDomains;
    this.auth = new GoogleAuth; // eslint-disable-line new-parens
    this.client = new this.auth.OAuth2(googleId, '', '');
    this.verifyIdTokenPromise = Utils.promisify(this.client.verifyIdToken, 1, this.client);
  }

  verifyIdToken(token) {
    return new Promise((resolve, reject) => {
      this.verifyIdTokenPromise(token, this.googleId)
      .then((login) => {
        const payload = login.getPayload();
        if (this.hostedDomains && this.hostedDomains.split('').some(domain => domain === payload.hd)) {
          resolve();
        } else {
          reject(new Error('Authentication Domain Does Not Match'));
        }
      })
      .catch(err => reject(err));
    });
  }
}

module.exports = {
  DisabledGoogleAuthStategy,
  EnabledGoogleAuthStrategy,
};
