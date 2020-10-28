const _ = require('lodash');
const { Utils } = require('swagger-boilerplate');

const readFile = Utils.promisify(require('fs').readFile);
const defaultJsonConfigPath = require('./serverConstants').DEFAULT_JSON_CONFIG_PATH;

const { env } = process;
const exports = module.exports = {};

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
    let value = env[aParam.envVar] || _.get(this.configJson, aParam.jsonPath, aParam.defaultValue);
    if (aParam.required && value === undefined) {
      throw new Error(`${aParam.envVar} must be supplied.`);
    }
    if (aParam.parser) {
      value = aParam.parser(value);
    }
    return value;
  }
}

// Promise wrapper around reading config file.
// Returns a Config instance
exports.readConfigJson = () => {
  let configPath = env.OTDEMO_CONFIG_FILE_PATH || defaultJsonConfigPath;
  return new Promise((resolve, reject) => {
    try {
      configPath = require.resolve(configPath);
      readFile(configPath).then(resolve);
    } catch (e) {
      (e.code === 'MODULE_NOT_FOUND' && (resolve('{}') || true)) || reject(e);
    }
  }).then((data) => new Config(JSON.parse(data)));
};
