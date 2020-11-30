module.exports = function (grunt) {
  grunt.registerTask('preBowerInstall', () => {
    grunt.file.setBase('test');
  });

  grunt.registerTask('postBowerInstall', () => {
    grunt.file.setBase('..');
  });
};
