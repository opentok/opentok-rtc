'use strict';

module.exports = function(grunt) {

  // To-Do check what we need and add/remove as needed...
  [
    'grunt-autoprefixer',
    'grunt-contrib-clean',
//    'grunt-contrib-compress',
//    'grunt-contrib-connect',
    'grunt-contrib-less',
    'grunt-contrib-watch',
    'grunt-mocha-test', // Server side test runner
    'grunt-bower-task',
    'grunt-gitinfo',
    'grunt-karma' // Client side test runner.
  ].forEach(grunt.loadNpmTasks);

  grunt.loadTasks('tasks');

  // To create HTML test files from a template. To-Do: Dunno if this is even needed or not
  var TEST_BASE_DIR = 'test/';

  grunt.initConfig({

    mochaTest: {
      unit: {
        options: {
          reporter: 'spec',
          captureFile: 'resultsUnit.txt',
          quiet: false,
          clearRequireCache: true
        },
        src: ['test/server/**/*_spec.js', '!test/server/firebaseArchives_spec.js']
      },
      archives: {
          options: {
            reporter: 'spec',
            captureFile: 'resultsUnit.txt',
            quiet: false,
            clearRequireCache: true
          },
          src: ['test/server/firebaseArchives_spec.js']
      },
      rest: {
        options: {
          reporter: 'spec',
          captureFile: 'resultsRest.txt',
          quiet: false,
          clearRequireCache: true
        },
        src: ['test/api/**/*_spec.js']
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

    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      integration: {
        singleRun: true
      },
      dev: {
      }
    },

    clean: { // To-Do: Configure or remove this!
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
          'web/css/room.opentok.css': 'web/less/room.less',
          'web/css/min.opentok.css': 'web/less/min.less',
          'web/css/webrtc.opentok.css': 'web/less/webrtc.less',
          'web/css/endMeeting.opentok.css': 'web/less/endMeeting.less',
          'web/css/annotation.opentok.css': 'web/less/annotation.less',
          'web/css/hangoutScroll.css': 'web/less/hangoutScroll.less'
        }
      }
    },

    autoprefixer: {
      options: {
        browsers: ['last 5 versions']
      },
      dist: {
        src: 'web/css/*.css'
      }
    },

    watch: {
      styles: {
        files: [
          './web/**/*.less'
        ],
        tasks: ['less', 'autoprefixer'],
        options: {
          nospawn: false
        }
      },
      server: {
        options: {
          nospawn: false
        },
        files: [
          './server.js',
          'server/**/*.js',
          'test/server/**/*.js'
        ],
        tasks: ['serverTest']
      }
    },
  });

  // On watch events, if the changed file is a test file then configure mochaTest to only
  // run the tests from that file. Otherwise run all the tests
  var defaultTestSrc = grunt.config('mochaTest.unit.src');
  grunt.event.on('watch', function(action, filepath) {
    grunt.config('mochaTest.unit.src', defaultTestSrc);
    if (filepath.match('test/')) {
      grunt.config('mochaTest.unit.src', filepath);
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
    'karma:dev'
  ]);

  grunt.registerTask('precommit', 'Run precommit tests', [
    'karma:integration',
    'mochaTest:unit',
    'apiTest'
  ]);

  grunt.registerTask('serverTest', 'Launch server unit tests', [
    'mochaTest:unit'
  ]);

  grunt.registerTask('apiTest', 'Launch server unit tests', [
    'mochaTest:rest'
  ]);

  grunt.registerTask('archivesTest', 'Launch server unit tests', [
    'mochaTest:archives'
  ]);

  grunt.registerTask('test', 'Launch server unit tests', function() {
    grunt.task.run(['configTests', 'serverTest']);
    if (grunt.option('enable-archives-test')) {
        grunt.task.run(['archivesTest']);
    }
    grunt.task.run(['apiTest','clientTest']);
  });

  grunt.registerTask('configTests', [
    'preBowerInstall',
    'bower:install',
    'postBowerInstall'
  ]);

  grunt.registerTask('initialConfig', [
    'clientBuild',
    'configTests'
  ]);

  grunt.registerTask('default', ['clientBuild']);
};
