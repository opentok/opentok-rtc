'use strict';

var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {

  // To-Do check what we need and add/remove as needed...
  [
    'grunt-autoprefixer',
    'grunt-contrib-clean',
//    'grunt-contrib-compress',
    'grunt-contrib-connect',
//    'grunt-contrib-copy',
    'grunt-contrib-less',
    'grunt-contrib-watch',
    'grunt-mocha-test', // Server side test runner
    'grunt-bower-task',
    'grunt-gitinfo',
    'grunt-karma' // Client side test runner. TO-DO: Change this for Karma?
  ].forEach(grunt.loadNpmTasks);

  grunt.loadTasks('tasks');

  // To create HTML test files from a template. To-Do: Dunno if this is even needed or not
  var TEST_BASE_DIR = 'test/';
  var TEST_HEADER = grunt.file.read(TEST_BASE_DIR + 'test_header.html');
  var TEST_FOOTER = grunt.file.read(TEST_BASE_DIR + 'test_footer.html');
  var TEST_DIR = TEST_BASE_DIR + 'unit/';
  var TEST_DIR_LENGTH = TEST_DIR.length;

  grunt.initConfig({

    mochaTest: {
      unit: {
        options: {
          reporter: 'spec',
          captureFile: 'resultsUnit.txt',
          quiet: false,
          clearRequireCache: false
        },
        src: ['test/unit/server/**/*.js']
      },
      rest: {
        options: {
          reporter: 'spec',
          captureFile: 'resultsRest.txt',
          quiet: false,
          clearRequireCache: false
        },
        src: ['test/api/**/*.js']
      }
    },

    bower: {// grunt.file.setBase('test');
      install: {
        options: {
          targetDir: './lib',
          layout: 'byType',
          install: true,
          verbose: false,
          cleanTargetDir: false,
          cleanBowerDir: true,
          bowerOptions: {}
        }
      }
    },

    connect: {
      test: {
        options: {
          port: 9002,
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test'),
              mountFolder(connect, 'app')
            ];
          }
        }
      }
    },

    karma: {
      // To-Do: Read https://github.com/karma-runner/grunt-karma and write this!
      // Also since this is what used to be needed for grunt-mocha it's probably not
      // needed at all...
      options: {
//        configFile: 'karma.conf.js',
        port: 9999,
        singleRun: true,
        browsers: ['PhantomJS'],
        logLevel: 'ERROR'
      },
      unit: {
        files: {
          src: grunt.file.
            expand({},
                   [TEST_DIR + ('test_' + (grunt.option('testFile') || '*') + '.js')]).map(
                     function(path) {
                       var testContent =
                         '<script src="' + path.replace(TEST_BASE_DIR, '') + '"></script>';

                       var outputFile =
                         ('gtest_' + path.substring(TEST_DIR_LENGTH)).replace('.js', '.html');

                          grunt.file.write(TEST_BASE_DIR + outputFile, TEST_HEADER + testContent +
                                           TEST_FOOTER);
                          return 'http://0.0.0.0:9002/' + outputFile;
                        }),
          reporter: grunt.option('testReporter') || 'Spec'
        }
      }
    },

    clean: { // To-Do: Configure this!
      server: [
        '.tmp'
      ],
      postTest: [
        'test/gtest_*.html'
      ]
    },

    'gitinfo': {
      options: {
        cwd: '.'
      }
    },

    less: {
      default: {
        files: {
          'web/css/landing.opentok.css': 'web/less/landing.less',
          'web/css/room.opentok.css': 'web/less/room.less'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 5 versions']
      },
      dist: {
        src: 'web/css/*.css'
      },
    },

    watch: {
      styles: {
        files: ['../../**/*.less'],
        tasks: ['less', 'autoprefixer'],
        options: {
          nospawn: true,
          livereload: {
            port: 35730
          }
        }
      }
    }

  });

  grunt.registerTask('clientBuild', 'Build css files', [
    'less',
    'autoprefixer'
  ]);

  grunt.registerTask('clientDev', 'Watch for changes on less files', [
    'clientBuild',
    'watch'
  ]);

  grunt.registerTask('clientTest', 'Launch client unit tests in shell with Karma + PhantomJS', [
    'connect:test',
    'karma',
    'clean:postTest'
  ]);

  grunt.registerTask('serverUnitTest', 'Launch server unit tests', [
    'clean:server',
    'mochaTest:unit'
  ]);

  grunt.registerTask('RESTApiTest', 'Launch server unit tests', [
    'clean:server',
    'mochaTest:rest'
  ]);

  grunt.registerTask('test', 'Launch server unit tests', [
    'serverUnitTest',
    'RESTApiTest',
    'clientTest'
  ]);

  grunt.registerTask('configTests', [
    'preBowerInstall',
    'bower:install',
    'postBowerInstall'
  ]);

  grunt.registerTask('default', ['test']);
};
