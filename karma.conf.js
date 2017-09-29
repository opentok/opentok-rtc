// Karma configuration
// Generated on Tue Sep 29 2015 19:25:55 GMT+0200 (CEST)

module.exports = function(config) {
    configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'test/lib/**/*.js',
      {pattern: 'test/mocks/mock_firebase.js', include: true},
      {pattern: 'test/mocks/mock_othelper.js', include: true},
      {pattern: 'test/mocks/mock_roomStatus.js', include: true},
      {pattern: 'test/mocks/mock_chat.js', include: true},
      'web/js/vendor/**/*.js',
      'web/js/libs/**/*.js',
      'node_modules/swagger-boilerplate/lib/shared/**/*.js',
      'web/js/components/modal.js',
      'web/js/landingView.js', // Don't load the views yet
      'web/js/landingController.js',
      'web/js/roomView.js',
      'web/js/roomController.js', // TO-DO...
      'web/js/helpers/textProcessor.js',
      'web/js/chatView.js',
      'web/js/chatController.js',
      'web/js/layouts.js',
      'web/**/*.js',
      'test/unit/**/*.html',
      'test/unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      '**/html_helper.js',
      'web/bower_components/**/*.js',
      'web/js/vendor/lazy_loader.js',
      'web/js/helpers/OTHelper.js',
      'web/js/vendor/opentok-annotation.js',
      'web/js/rtcApp.js',
      'web/js/vendor/opentok-annotation.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.html': ['html2js']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox', 'Chrome'],

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  };

  if (process.env.TRAVIS) {
       configuration.browsers = ['Firefox', 'Chrome_travis_ci'];
   }

  config.set(configuration);

}
