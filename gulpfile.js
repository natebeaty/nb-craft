const gulp         = require('gulp');
const gulpif       = require('gulp-if');
const sass         = require('gulp-sass')(require('sass'));
const uglify       = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS     = require('gulp-clean-css');
const include      = require('gulp-include');
const rev          = require('gulp-rev');
const revNapkin    = require('gulp-rev-napkin');
const sourcemaps   = require('gulp-sourcemaps');
const argv         = require('yargs').argv;
const notify       = require('gulp-notify');
const del          = require('del');
const browsersync  = require('browser-sync').create();
const isProduction = argv.production;

const conf = {
  siteUrl: 'nb-craft3.localhost'
};

function styles() {
  return gulp.src([
      'assets/scss/application.scss',
    ])
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(sass())
    .on('error', notify.onError(function(error) {
       return 'Styles error!' + error;
    }))
    .pipe(autoprefixer())
    .pipe(gulpif(isProduction, cleanCSS()))
    .pipe(gulp.dest('web/assets/dist/css'))
    .pipe(gulpif(!isProduction, sourcemaps.write('maps')))
    .pipe(gulpif(!isProduction, gulp.dest('web/assets/dist/css')))
    .pipe(browsersync.stream())
    .pipe(notify({
      message: 'Styles smashed.', 
      onLast: true
    }));
}

function scripts() {
  return gulp.src([
      'assets/js/application.js',
    ])
    .pipe(include())
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(gulpif(isProduction, uglify()))
    .pipe(gulpif(isProduction, gulp.dest('web/assets/dist/js')))
    .on('error', notify.onError(function(error) {
       return 'Scripts error!' + error;
    }))
    .pipe(gulpif(!isProduction, sourcemaps.write('maps')))
    .pipe(gulpif(!isProduction, gulp.dest('web/assets/dist/js')))
    .pipe(notify({
      message: 'Scripts smashed.', 
      onLast: true
    }));
}

function revFiles() {
  return gulp.src(['web/assets/dist/**/*.{css,js,jpg,png,gif}'])
    .pipe(rev())
    .pipe(gulp.dest('web/assets/dist'))
    .pipe(gulpif(isProduction, revNapkin()))
    .pipe(rev.manifest())
    .pipe(gulp.dest('web/assets/dist'))
}

// `gulp clean` - Deletes the build folder entirely.
function clean() {
  return del([ 'web/assets/dist/' ]);
}

function copy() {
  gulp.src(['assets/js/modernizr.custom.js'])
    .pipe(gulp.dest('web/assets/dist/js/'));
  gulp.src(['assets/js/lazysizes.min.js'])
    .pipe(gulp.dest('web/assets/dist/js/'));
  gulp.src(['assets/svg/*'])
    .pipe(gulp.dest('web/assets/dist/svg/'));
  return gulp.src(['assets/img/*'])
    .pipe(gulp.dest('web/assets/dist/img/'));
}


function watchFiles() {
  gulp.watch('assets/scss/**/*.scss', gulp.series(styles));
  gulp.watch('assets/js/**/*.js', gulp.series(scripts));
}

function browserSync() {
  browsersync.init({
    proxy: conf.siteUrl,
    notify: false,
    open: false
  });
}

const build = gulp.series(clean, gulp.parallel(copy, styles, scripts), revFiles);
const watch = gulp.series(clean, gulp.parallel(copy, styles, scripts, watchFiles, browserSync));

// export tasks
exports.build = build;
exports.watch = watch;
exports.default = build;
