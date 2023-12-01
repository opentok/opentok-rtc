// Karma configuration
// Generated on Tue Sep 29 2015 19:25:55 GMT+0200 (CEST)

module.exports = function (config) {
  configuration = {

    plugins: ['karma-mocha', 'karma-chai', 'karma-sinon', 'karma-browserify', 'karma-coverage', 'karma-html2js-preprocessor', 'karma-chrome-launcher', 'karma-firefox-launcher'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon', 'chai', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/mocks/mock_othelper.js', include: true },
      { pattern: 'test/mocks/mock_roomStatus.js', include: true },
      { pattern: 'test/mocks/mock_chat.js', include: true },
      'web/js/vendor/**/*.js',
      'web/js/libs/**/*.js',
      'node_modules/swagger-boilerplate/lib/shared/**/*.js',
      'web/js/components/modal.js',
      'web/js/roomView.js',
      'web/js/roomController.js', // TO-DO...
      'web/js/helpers/textProcessor.js',
      'web/js/chatView.js',
      'web/js/chatController.js',
      'web/js/layouts.js',
      'web/**/*.js',
      'test/unit/**/*.html',
      'test/unit/**/*.js',
    ],

    // list of files to exclude
    exclude: [
      'web/js/min/*.min.js',
      '**/html_helper.js',
      'web/bower_components/**/*.js',
      'web/js/vendor/lazy_loader.js',
      'web/js/helpers/OTHelper.js',
      'web/js/rtcApp.js',
      'web/js/vendor/opentok-annotation.js',
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.html': ['html2js'],
      'web/**/*.js': ['coverage'],
      'test/unit/browserUtils_spec.js': ['browserify'],
      'test/unit/chatController_spec.js': ['browserify'],
      'test/unit/chatView_spec.js': ['browserify'],
      'test/unit/cronograph_spec.js': ['browserify'],
      'test/unit/draggable_spec.js': ['browserify'],
      'test/unit/feedbackController_spec.js': ['browserify'],
      'test/unit/feedbackView_spec.js': ['browserify'],
      'test/unit/itemsHandler_spec.js': ['browserify'],
      'test/unit/layoutMenuView_spec.js': ['browserify'],
      'test/unit/layouts_spec.js': ['browserify'],
      'test/unit/precallController_spec.js': ['browserify'],
      'test/unit/precallView_spec.js': ['browserify'],
      'test/unit/recordingsController_spec.js': ['browserify'],
      'test/unit/recordingsView_spec.js': ['browserify'],
      'test/unit/roomStatus_spec.js': ['browserify'],
      'test/unit/roomView_spec.js': ['browserify'],
      'test/unit/screenShareController_spec.js': ['browserify'],
      'test/unit/screenShareView_spec.js': ['browserify'],

    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    coverageReporter: {
      dir: 'coverage',
      instrumenter: {
        'web/**/*.js': ['istanbul'],
      },
      reporters: [
        { type: 'html', subdir: 'report-html' },
        { type: 'lcov', subdir: 'report-lcov' },
        { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
      ],
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox', 'Chrome'],

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['Firefox', 'Chrome_travis_ci'];
  }

  config.set(configuration);
};
