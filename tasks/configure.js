'use strict';

module.exports = function(grunt) {

  grunt.registerTask('preBowerInstall', function() {
    grunt.file.setBase('test');
  });

  grunt.registerTask('postBowerInstall', function() {
    grunt.file.setBase('..');
  });

};

