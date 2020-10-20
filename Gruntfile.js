'use strict';

module.exports = function (grunt) {
  // To-Do check what we need and add/remove as needed...
  [
    'grunt-autoprefixer',
    'grunt-contrib-clean',
    'grunt-contrib-less',
    'grunt-terser',
    'grunt-contrib-concat',
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
    terser: {
      pages: {
        options: {
          compress: true,
          safari10: true,
          ecma: 2016,
          sourceMap: {
            includeSources: true
          }
        },
        files: [
          {
            expand: true,
            src: '*.js',
            dest: './web/js/min',
            cwd: './web/js',
            ext: '.min.js'
          }
        ]
      },
      prod_build: {
        options: {
          compress: true,
          safari10: true,
          ecma: 2016
        },
        files: [
          {
            expand: true,
            src: '*.js',
            dest: './web/js/min',
            cwd: './web/js',
            ext: '.min.js'
          }
        ]
      }

    },
    concat: {
      dist: {
        options: {
          process: function (src, filepath) {
            return src + '\n //# sourceMappingURL= ' + filepath.substring(filepath.lastIndexOf('/') + 1) + '.map';
          }
        },
        files: {
          './web/js/min/chatView.min.js': ['./web/js/min/chatView.min.js'],
          './web/js/min/chatController.min.js': ['./web/js/min/chatController.min.js'],
          './web/js/min/feedbackView.min.js': ['./web/js/min/feedbackView.min.js'],
          './web/js/min/feedbackController.min.js': ['./web/js/min/feedbackController.min.js'],
          './web/js/min/precallView.min.js': ['./web/js/min/precallView.min.js'],
          './web/js/min/precallController.min.js': ['./web/js/min/precallController.min.js'],
          './web/js/min/phoneNumberView.min.js': ['./web/js/min/phoneNumberView.min.js'],
          './web/js/min/phoneNumberController.min.js': ['./web/js/min/phoneNumberController.min.js'],
          './web/js/min/recordingsView.min.js': ['./web/js/min/recordingsView.min.js'],
          './web/js/min/recordingsController.min.js': ['./web/js/min/recordingsController.min.js'],
          './web/js/min/screenShareView.min.js': ['./web/js/min/screenShareView.min.js'],
          './web/js/min/screenShareController.min.js': ['./web/js/min/screenShareController.min.js'],
          './web/js/min/roomController.min.js': ['./web/js/min/roomController.min.js']
        }
      }
    },
    mochaTest: {
      unit: {
        options: {
          reporter: 'spec',
          captureFile: 'resultsUnit.txt',
          quiet: false,
          clearRequireCache: true
        },
        src: [
          'test/server/**/*_spec.js',
          '!test/server/firebaseArchives_spec.js'
        ]
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

    bower: {
      // grunt.file.setBase('test');
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
      dev: {}
    },

    clean: {
      // To-Do: Configure or remove this!
    },

    gitinfo: {
      options: {
        cwd: '.'
      }
    },

    less: {
      default: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          'web/css/landing.opentok.css': 'web/less/landing.less',
          'web/css/room.opentok.css': 'web/less/room.less',
          'web/css/endMeeting.opentok.css': 'web/less/endMeeting.less',
          'web/css/annotation.opentok.css': 'web/less/annotation.less',
          'web/css/hangoutScroll.css': 'web/less/hangoutScroll.less',
          'web/css/completeMeeting.opentok.css':
            'web/less/completeMeeting.less'
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
        files: ['./web/**/*.less'],
        tasks: ['less', 'autoprefixer'],
        options: {
          nospawn: false
        }
      },
      server: {
        options: {
          nospawn: false
        },
        files: ['./server.js', 'server/**/*.js', 'test/server/**/*.js'],
        tasks: ['serverTest']
      }
    }
  });

  // On watch events, if the changed file is a test file then configure mochaTest to only
  // run the tests from that file. Otherwise run all the tests
  var defaultTestSrc = grunt.config('mochaTest.unit.src');
  grunt.event.on('watch', function (action, filepath) {
    grunt.config('mochaTest.unit.src', defaultTestSrc);
    if (filepath.match('test/')) {
      grunt.config('mochaTest.unit.src', filepath);
    }
  });

  grunt.registerTask('clientBuild', 'Build css files', [
    'less',
    'autoprefixer',
    'terser',
    'concat'
  ]);

  grunt.registerTask('clientBuild-Prod', 'Build css files', [
    'less',
    'autoprefixer',
    'terser:prod_build'
  ]);

  grunt.registerTask('clientDev', 'Watch for changes on less files', [
    'clientBuild',
    'watch'
  ]);

  grunt.registerTask(
    'clientTest',
    'Launch client unit tests in shell with Karma + PhantomJS',
    ['karma:dev']
  );

  grunt.registerTask('precommit', 'Run precommit tests', [
    'karma:integration',
    'mochaTest:unit',
    'apiTest'
  ]);

  grunt.registerTask('serverTest', 'Launch server unit tests', [
    'mochaTest:unit'
  ]);

  grunt.registerTask('apiTest', 'Launch server unit tests', ['mochaTest:rest']);

  grunt.registerTask('archivesTest', 'Launch server unit tests', [
    'mochaTest:archives'
  ]);

  grunt.registerTask('test', 'Launch server unit tests', function () {
    grunt.task.run(['configTests', 'serverTest']);
    if (grunt.option('enable-archives-test')) {
      grunt.task.run(['archivesTest']);
    }
    grunt.task.run(['apiTest', 'clientTest']);
  });

  grunt.registerTask('configTests', [
    'preBowerInstall',
    'bower:install',
    'postBowerInstall'
  ]);

  grunt.registerTask('initialConfig', ['clientBuild', 'configTests']);

  grunt.registerTask('default', ['clientBuild']);
};
