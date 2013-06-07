'use strict';

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var config = {
        src: 'src',
        dist: 'dist',
        host: '0.0.0.0',
        port: 9000
    };

    grunt.initConfig({
        config: config,
        watch: {
            js: {
                files: [
                    '<%= config.src %>/*.js'
                ],
                tasks: ['default']
            },
        },
        clean: {
            dist: ['.tmp', '<%= config.dist %>/*'],
            test: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= config.src %>/*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: ['test/{,*/}*.html']
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= site.src %>',
                    dest: '<%= site.dist %>',
                    src: []
                }]
            },
        },
    });

    grunt.renameTask('regarde', 'watch');

    grunt.registerTask('test', [
        // 'jshint',
        'mocha'
    ]);

    grunt.registerTask('default', [
        'test'
    ]);
};
