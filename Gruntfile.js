'use strict';
module.exports = function (grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    var config = {
        src: 'src',
        dist: 'dist',
        test: 'test',
        host: '0.0.0.0',
        port: 9000
    };

    grunt.initConfig({
        config: config,
        watch: {
            js: {
                files: [
                    '<%= config.src %>/*.js',
                    '<%= config.test %>/**/*.js'
                ],
                tasks: ['default']
            },
        },
        clean: {
            dist: ['<%= config.dist %>/*'],
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
        uglify: {
            my_target: {
                files: {
                    '<%= config.dist %>/genev.min.js': ['<%= config.src %>/genev.js']
                }
            }
        },
        mocha: {
            all: ['test/{,*/}*.html']
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.src %>',
                    dest: '<%= config.dist %>',
                    src: ['genev.js']
                }]
            },
        },
    });


    grunt.registerTask('test', [
        // 'jshint',
        'mocha'
    ]);

    grunt.registerTask('dist', ['clean', 'copy', 'uglify']);

    grunt.registerTask('default', [
        'test',
        'dist'
    ]);

};
