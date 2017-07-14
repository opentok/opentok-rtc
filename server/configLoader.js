'use strict';

var _ = require('lodash');
var Utils = require('swagger-boilerplate').Utils;

var readFile = Utils.promisify(require('fs').readFile);
var readFileSync = require('fs').readFileSync;
var path = require('path');
const C = require('./serverConstants');

var env = process.env;
var exports = module.exports = {};

class Config {
  constructor(aConfigJson) {
    this.configJson = aConfigJson;
  }

  // aParam: Object with properties:
  // envVar: Name of environment Variable to look for
  // jsonPath: Path to value in object this.configJson
  // defaultValue: Value to use if neither environment variable nor json found.
  // parser: Function to return value as correct type i.e. parseInt.
  // required: boolean, whether value can be undefined, or throw error.
  get(aParam) {
    var value = env[aParam.envVar] || _.get(this.configJson, aParam.jsonPath, aParam.defaultValue);
    if (aParam.required && value === undefined) {
      throw new Error(`${aParam.envVar} must be supplied.`);
    }
    if (aParam.parser) {
      value = aParam.parser(value);
    }
    return value;
  }

  firebaseConfig() {
    var fbConfig = {};
    var _readconfig = function (p) {
      return readFileSync(path.resolve(path.join('config', p))).toString('utf-8');
    };
    fbConfig.apiKey = this.get(C.FIREBASE_API_KEY);
    fbConfig.dataUrl = this.get(C.FIREBASE_DATA_URL);
    fbConfig.credentialPath = this.get(C.FIREBASE_CREDENTIAL_PATH);
    fbConfig.credential = this.get(C.FIREBASE_CREDENTIAL);
    if (!fbConfig.credential && fbConfig.credentialPath) {
      fbConfig.credential = JSON.parse(_readconfig(fbConfig.credentialPath));
    }
    if (fbConfig.credential && typeof fbConfig.credential === 'string') {
      fbConfig.credential = JSON.parse(fbConfig.credential);
    }
    if (!(fbConfig.apiKey && fbConfig.dataUrl && fbConfig.credential)) {
      this.configJson.Firebase = null;
      return this;
    }
    fbConfig.ios = {
      appId: this.get(C.FIREBASE_IOS_APP_ID),
      senderId: this.get(C.FIREBASE_IOS_SENDER_ID),
    };
    if (this.get(C.FIREBASE_ANDROID_CONFIG || this.get(C.FIREBASE_ANDROID_CONFIG_PATH))) {
      var androidConfig = this.get(C.FIREBASE_ANDROID_CONFIG);
      var androidConfigPath = this.get(C.FIREBASE_ANDROID_CONFIG_PATH);
      if (!androidConfig && androidConfigPath) {
        fbConfig.android = JSON.parse(_readconfig(fbConfig.android.configPath));
      }
      if (androidConfig && typeof androidConfig === 'string') {
        fbConfig.android = JSON.parse(androidConfig);
      }
    } else {
      fbConfig.android = null;
    }
    this.configJson.Firebase = fbConfig;
    return this;
  }
}

// Promise wrapper around reading config file.
// Returns a Config instance
exports.readConfigJson = () => {
  var configPath = env.OTDEMO_CONFIG_FILE_PATH || C.DEFAULT_JSON_CONFIG_PATH;
  return new Promise((resolve, reject) => {
    try {
      configPath = require.resolve(configPath);
      readFile(configPath).then(resolve);
    } catch (e) {
      (e.code === 'MODULE_NOT_FOUND' && (resolve('{}') || true)) || reject(e);
    }
  }).then(data => (new Config(JSON.parse(data)).firebaseConfig()));
};
