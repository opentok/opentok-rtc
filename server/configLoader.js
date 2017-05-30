'use strict';

var fs = require('fs')
var _ = require('lodash');
var env = process.env;
var exports = module.exports = {};

class ConfigLoader {
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
        if (aParam.required && value === undefined)
            throw new Error(`${aParam.envVar} must be supplied.`)
        if (aParam.parser)
            value = aParam.parser(value);
        return value
    }
}

// Promise wrapper around reading config file.
// Returns a ConfigLoader instance
exports.readConfigJson = () => {
    var configPath = env.OTDEMO_CONFIG_FILE_PATH || '../config/config.json'
    return new Promise((resolve, reject) => {
      try {
          configPath = require.resolve(configPath);
      } catch (e) {
          if (e.code === 'MODULE_NOT_FOUND'){
            console.log(`Config file ${configPath} not found.`);
            resolve(new ConfigLoader());
          }
          throw e;
      }
      fs.readFile(require.resolve(configPath), (err, data) => {
        if (err)
            reject(err)
        resolve(new ConfigLoader(JSON.parse(data)));
      });
  })
}
