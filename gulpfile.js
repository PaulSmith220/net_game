'use strict';

var gulp = require('gulp'),
    connect = require('gulp-connect');

gulp.task('server', function() {
    connect.server({
        host: 'localhost',
        port: 4000,
        livereload: false
    });
});