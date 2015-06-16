/* To install:
      sudo npm install -g gulp
      npm install
   to compile css:
      gulp css
   to compile js:
      gulp js
   to compile templates:
      gulp templates
   
   Then you can use indexc.html.
*/

var gulp = require('gulp');
var templateCache = require('gulp-angular-templatecache');
var minifyCSS = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('css', function() {
  gulp.src(['assets/css/*.css','forum/forum.css'])
    .pipe(sourcemaps.init())
    .pipe(minifyCSS())
    .pipe(sourcemaps.write())
    .pipe(concat('style.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('js', function() {
  gulp.src(['ext/inheritance.js','algorea.js','modelsManager/*.js','sync/*.js','shared/*.js','treeview/*.js','login/*.js','layout.js','navigation/*.js','community/*.js','ext/integrationAPI.01/task-proxy-xd.js','states.js','task/*.js','userInfos/*.js','forum/*.js'])
//    .pipe(jshint())
//    .pipe(jshint.reporter('jshint-stylish'))
//    .pipe(sourcemaps.init())
    .pipe(uglify())
//    .pipe(sourcemaps.write())
    .pipe(concat('algorea.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('templates', function () {
    gulp.src(['**/*html','!ext/**/*.html','!*.html','!admin/**/*.html','!node_modules/**/*.html','!angularDirectives/*.html','!sync/*.html'])
        .pipe(templateCache({module: 'algorea'}))
        .pipe(gulp.dest('dist'));
});
