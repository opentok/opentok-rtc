const DEBUG = process.env.DEBUG;

const config = {

  // set to true it starts the test runner processes with an open debugger port
  debug: DEBUG,

  name: 'OT Demo Regression Tests',

  // sets the global timeout for all waitFor commands
  waitforTimeout: !DEBUG ? 5 * 60 * 1000 : Infinity,

  specs: [
    'test/regression_tests/specs/*.js'
  ],

  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: !DEBUG ? 1 : 1,
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://docs.saucelabs.com/reference/platforms-configurator
  //
  capabilities: [
  ],
  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // By default WebdriverIO commands are executed in a synchronous way using
  // the wdio-sync package. If you still want to run your tests in an async way
  // e.g. using promises you can set the sync option to false.
  sync: true,
  //
  // Level of logging verbosity: silent | verbose | command | data | result | error
  logLevel: 'error',
  //
  // Enables colors for log output.
  coloredLogs: true,
  //
  // Saves a screenshot to a given path if a command fails.
  screenshotPath: './errorShots/',
  //
  // Set a base URL in order to shorten url command calls. If your url parameter starts
  // with "/", then the base url gets prepended.
  baseUrl: 'http://localhost:8123',

  //
  // Default timeout in milliseconds for request
  // if Selenium Grid doesn't send response
  connectionRetryTimeout: 5 * 60 * 1000,
  //
  // Default request retries count
  connectionRetryCount: 1,
  //
  // Initialize the browser instance with a WebdriverIO plugin. The object should have the
  // plugin name as key and the desired plugin options as properties. Make sure you have
  // the plugin installed before running any tests. The following plugins are currently
  // available:
  // WebdriverCSS: https://github.com/webdriverio/webdrivercss
  // WebdriverRTC: https://github.com/webdriverio/webdriverrtc
  // Browserevent: https://github.com/webdriverio/browserevent
  // plugins: {
  //     webdrivercss: {
  //         screenshotRoot: 'my-shots',
  //         failedComparisonsRoot: 'diffs',
  //         misMatchTolerance: 0.05,
  //         screenWidth: [320,480,640,1024]
  //     },
  //     webdriverrtc: {},
  //     browserevent: {}
  // },
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: [
    'firefox-profile'
  ],
  reporters: ['dot', 'spec'],
  //  seleniumArgs: {
  //    drivers: {
  //      chrome: {
  //        version: '2.46',
  //        baseURL: 'https://chromedriver.storage.googleapis.com'
  //      }
  //    }
  //  },
  //  seleniumInstallArgs: {
  //    drivers: {
  //      chrome: {
  //        version: '2.46',
  //        baseURL: 'https://chromedriver.storage.googleapis.com'
  //      }
  //    }
  //  },
  //
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: http://webdriver.io/guide/testrunner/frameworks.html
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'mocha',
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: http://webdriver.io/guide/testrunner/reporters.html
  // reporters: ['dot'],
  //
  // Options to be passed to Mocha.
  // See the full list at http://mochajs.org/
  mochaOpts: {
    timeout: !DEBUG ? 5 * 60 * 1000 : Infinity,
    ui: 'bdd'
  },
  onPrepare: function () {
    // eslint-disable-next-line
        console.log('let\'s go')
  },
  onComplete: function () {
    // eslint-disable-next-line
        console.log('that\'s it')
  }
};

if (process.env.SAUCE_USERNAME) {
  config.services.push('sauce');
  config.protocol = 'http';
  config.sauceConnect = true;
  config.sauceConnectOpts = {
    tunnelDomains: ['localhost']
  };
  config.capabilities.push({
    browserName: 'chrome',
    platform: 'macOS 10.14',
    version: 'latest',
    screenResolution: '1376x1032',
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY
  });
  config.capabilities.push({
    browserName: 'firefox',
    platform: 'Windows 8.1',
    version: 'latest',
    screenResolution: '1280x960',
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY
  });
} else {
  config.services.push('selenium-standalone');
  config.capabilities.push({
    browserName: 'chrome',
    browserVersion: '86.0'
  });
  config.capabilities.push({
    browserName: 'firefox',
    browserVersion: '81.0.1'
  });
}

exports.config = config;
