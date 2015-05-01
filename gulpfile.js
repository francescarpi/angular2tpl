/* jslint node: true */
'use strict';

/* Requerimientos */
var gulp = require('gulp');
var webserver = require('gulp-webserver');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var traceur = require('gulp-traceur');
var uglify = require('gulp-uglify');
var less = require('gulp-less');

/* Variables varias */
var PATHS = {
    src: {
        html: 'src/**/*.html',
        css: 'src/**/*.less',
        js: 'src/**/*.js'
    },
    lib: [
      'node_modules/gulp-traceur/node_modules/traceur/bin/traceur-runtime.js',
      'node_modules/es6-module-loader/dist/es6-module-loader-sans-promises.src.js',
      'node_modules/systemjs/lib/extension-register.js',
      'node_modules/angular2/node_modules/zone.js/zone.js',
      'node_modules/angular2/node_modules/zone.js/long-stack-trace-zone.js'
    ]
};

/* Copia y trata los ficheros html */
gulp.task('html', function() {
    return gulp.src(PATHS.src.html).pipe(gulp.dest('dist'));
});

/* Copia y trata ficheros css */
gulp.task('css', function() {
    return gulp.src(PATHS.src.css).pipe(
        less({ paths: PATHS.src.css })
    ).pipe(gulp.dest('dist'));
});

/* Copia las librerías necesarias para funcionar */
gulp.task('libs', ['angular2'], function () {
    var size = require('gulp-size');
    return gulp.src(PATHS.lib)
        .pipe(uglify())
        .pipe(size({showFiles: true, gzip: true}))
        .pipe(gulp.dest('dist/lib'));
});

/* Compila las librerías de angular 2 */
gulp.task('angular2', function () {
  var buildConfig = {
    paths: {
      "angular2/*": "node_modules/angular2/es6/prod/*.es6",
      "rx/*": "node_modules/angular2/node_modules/rx/*.js"
    }
  };

  var Builder = require('systemjs-builder');
  var builder = new Builder(buildConfig);

  return builder.build('angular2/angular2', 'dist/lib/angular2.js', {});
});

/* Copia y trata ficheros js */
gulp.task('js', ['libs'], function() {
    return gulp.src(PATHS.src.js)
        .pipe(rename({extname: ''})) //hack, see: https://github.com/sindresorhus/gulp-traceur/issues/54
        .pipe(plumber())
        .pipe(traceur({
            modules: 'instantiate',
            moduleName: true,
            annotations: true,
            types: true,
            memberVariables: true
        }))
        .pipe(rename({extname: '.js'})) //hack, see: https://github.com/sindresorhus/gulp-traceur/issues/54
        .pipe(gulp.dest('dist'));
});


/* Servidor web simple */
gulp.task('dev', ['html', 'css', 'js'], function() {

    /* Observamos distintos tipos de ficheros, al ser modificados, los trasladamos a la carpeta dist */
    gulp.watch(PATHS.src.html, ['html']);
    gulp.watch(PATHS.src.css, ['css']);
    gulp.watch(PATHS.src.js, ['js']);

    /* Arrancamos servidor */
    gulp.src('dist').pipe(webserver({
        host: '127.0.0.1',
        port: 8000,
        livereload: false
    }));
});

