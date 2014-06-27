var gulp = require('gulp');

var concat = require('gulp-concat');
var connect = require('gulp-connect');
var gulpIgnore = require('gulp-ignore');
var clean = require('gulp-clean');

var githubIODest = "../coolchem.github.io/";

var paths = {
    scripts:['**/*.js','!node_modules/**/*'],
    css:['**/*.css','**/*.png','!node_modules/**/*'],
    json:['**/*.json','!node_modules/**/*'],
    html:['**/*.html','!node_modules/**/*'],
    rama:'../rama/build/rama.js'
};

gulp.task('clean-guithub-io', function () {
    return gulp.src('../coolchem.github.io/**/*', {read: false})
            .pipe(clean({force: true}));
});

gulp.task('scripts', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.scripts)
            .pipe(gulp.dest(githubIODest));
});

gulp.task('css', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.css)
            .pipe(gulp.dest(githubIODest));
});

gulp.task('json', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.json)
            .pipe(gulp.dest(githubIODest));
});

gulp.task('html', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.html)
            .pipe(gulp.dest(githubIODest));
});

gulp.task('connectDev', function () {
    connect.server({
        port: 8000
    });
});

gulp.task('default', ['connectDev']);

gulp.task('pushToGitHubIO', ['scripts','css','json','html']);
