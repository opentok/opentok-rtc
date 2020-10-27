'use strict';

const gitRev = require('git-rev');
var pkg = require('../package.json');

// eslint-disable-next-line quotes
const INVALID_GOOGLE_TOKEN = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjU1Yjg1NGVkZjM1ZjA5M2I0NzA4ZjcyZGVjNGYxNTE0OTgzNmU4YWMifQ.eyJhenAiOiIxMjg2NzkxMDY5ODMtNnBhbjM1NzdrZmxiZTA4dnIyMjdmYTk2bzFmdDdqZWYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIxMjg2NzkxMDY5ODMtNnBhbjM1NzdrZmxiZTA4dnIyMjdmYTk2bzFmdDdqZWYuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDEzNTgyOTg1MDg4Mjg2OTg2MTkiLCJoZCI6InRva2JveC5jb20iLCJlbWFpbCI6InN3YXJ0ekB0b2tib3guY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ0MjJ6aWZfTjZEdWZGaFNQbG5jUzN3IiwiZXhwIjoxNTM2MDk4NTk4LCJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwianRpIjoiNzc4MDZkNGRiNDE3MjQyN2I1YTJjZTIwOWMwMTJkM2EzMmRjNWY4OSIsImlhdCI6MTUzNjA5NDk5OCwibmFtZSI6IkplZmYgU3dhcnR6IiwicGljdHVyZSI6Imh0dHBzOi8vbGg2Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tV2tWVEtCeGs5ZEUvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQTAveXZzdEY4REdlY1Uvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IkplZmYiLCJmYW1pbHlfbmFtZSI6IlN3YXJ0eiIsImxvY2FsZSI6ImVuIn0.Oza-4lF6X7va8NjWuXLAWh48qBdfEQ28ac_fwtlvhM-44cH4AsS5IGd_4_0EL0WlQQZgDfSoip0FBAOPamGAIE9HIV4QydMSD9AM7BS_v0g4HJPpInMFZyz746ZgmaIYzIDje8yiid2HgpFmNrESUQhmEVBl33scFgWVjwMKyTkBoefsHWr8grhYhUMWo7bIgoNUVY65GdgvJWlkoTC4abX_aU1BcCprcBzfmwLHHzXKobM4CGJSQKaWi_eOZmOSTzRn3W8uMtR4BAe780Wq9oN22IrQ9WxXz3Qppl9bX0vCKtb6ERL8s8VTsgE-EzB536CDnNGAKq-6bPS2CDruCw`;

const TIMEOUT = 20000; // 20-second timeout for each async test

module.exports = (config, googleAuth) => new Promise((resolve, reject) => {
  const healthObj = {
    name: pkg.name,
    version: pkg.version
  };

  const gitHash = () => new Promise((resolve) => {
    gitRev.long((hash) => {
      healthObj.gitHash = hash;
      resolve();
    });
  });

  const testOpenTok = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('OpenTok API server timeout exceeded.'));
    }, TIMEOUT);
    config.otInstance.createSession((error) => {
      if (error) {
        healthObj.opentok = false;
        return reject(error);
      }
      healthObj.opentok = true;
      return resolve();
    });
  });

  const testGoogleAuth = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Google Authentication timeout exceeded.'));
    }, TIMEOUT);
    if (config.sipRequireGoogleAuth) {
      googleAuth.verifyIdToken(INVALID_GOOGLE_TOKEN).catch((error) => {
        if (error.message === 'Authentication Domain Does Not Match'
          || (error.message.indexOf('Token used too late') > -1)) {
          // Good -- we expect an error using the invalid token.
          healthObj.googleAuth = true;
          resolve();
        } else {
          healthObj.googleAuth = false;
          reject(error);
        }
      });
    } else {
      healthObj.googleAuth = true;
      resolve();
    }
  });

  gitHash()
    .then(testOpenTok)
    .then(testGoogleAuth)
    .then(() => {
      healthObj.status = 'pass';
      resolve(healthObj);
    })
    .catch((error) => {
      healthObj.status = 'fail';
      healthObj.error = error.message;
      reject(healthObj);
    });
});
