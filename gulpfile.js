/* To install:
      sudo npm install -g gulp
      npm install

   to compile js, css and images:
      gulp local

   to compile bower dependencies:
      gulp vendor

   Then you can use dist/index.html.
*/

var gulp = require('gulp');
var templateCache = require('gulp-angular-templatecache');
var minifyCSS = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
//var jshint = require('gulp-jshint');
//var stylish = require('jshint-stylish');
var mainBowerFiles = require('main-bower-files');

gulp.task('css', function() {
  return gulp.src(['algorea.css','forum/forum.css'])
    //.pipe(sourcemaps.init())
    .pipe(minifyCSS())
    //.pipe(sourcemaps.write())
    .pipe(concat('algorea.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('admin-css', function() {
  return gulp.src(['admin/admin.css'])
    //.pipe(sourcemaps.init())
    .pipe(minifyCSS())
    //.pipe(sourcemaps.write())
    .pipe(concat('admin.css'))
    .pipe(gulp.dest('dist/admin'));
});

gulp.task('js', function() {
  return gulp.src(['ext/inheritance.js','algorea.js','commonFramework/modelsManager/*.js','commonFramework/sync/*.js','shared/*.js','commonFramework/treeview/*.js','login/*.js','layout.js','navigation/*.js','groupRequests/*.js','community/*.js','states.js','task/*.js','userInfos/*.js','forum/*.js'])
//    .pipe(jshint())
//    .pipe(jshint.reporter('jshint-stylish'))
//    .pipe(sourcemaps.init())
    .pipe(uglify())
//    .pipe(sourcemaps.write())
    .pipe(concat('algorea.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('admin-js', function() {
  return gulp.src(['ext/inheritance.js','shared/models.js','commonFramework/modelsManager/*.js','commonFramework/sync/*.js','commonFramework/treeview/*.js','login/service.js','admin/itemsCtrl.js','task/*.js','admin/adminUserItemController.js', 'admin/groupsCtrl.js'])
//    .pipe(jshint())
//    .pipe(jshint.reporter('jshint-stylish'))
//    .pipe(sourcemaps.init())
    .pipe(uglify())
//    .pipe(sourcemaps.write())
    .pipe(concat('admin.js'))
    .pipe(gulp.dest('dist/admin'));
});

gulp.task('templates', function () {
    return gulp.src(['**/*html','!ext/**/*.html','!*.html','!admin/**/*.html','!node_modules/**/*.html','!dist/**/*.html','!commonFramework/angularDirectives/*.html','!commonFramework/sync/*.html'])
        .pipe(templateCache({module: 'algorea'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('admin-templates', function () {
    return gulp.src(['admin/**/*html','**/*html','!ext/**/*.html','!*.html','!groupRequests/**/*.html','!admin/*.html','!forum/**/*.html','!userInfos/**/*.html','!community/**/*.html','!dist/**/*.html','!navigation/**/*.html','!node_modules/**/*.html','!commonFramework/sync/*.html'])
        .pipe(templateCache({module: 'algorea'}))
        .pipe(gulp.dest('dist/admin'));
});

gulp.task('images', function () {
    return gulp.src(['images/*.png'])
        .pipe(gulp.dest('dist/images'));
});

gulp.task('vendor-js', function() {
  return gulp.src(mainBowerFiles({"filter": '**/*.js', "overrides": {"bootstrap": {"main": []}, "angular-i18n": {"main": ['angular-locale_fr-fr.js']}}})) // exclude bootstrap from included js
    .pipe(uglify())
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('vendor-css', function() {
  return gulp.src(mainBowerFiles([['**/*.css']]))
    .pipe(minifyCSS())
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('vendor-fonts', function() {
  return gulp.src(mainBowerFiles([['**/fonts/*']]))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('vendor-images', function() {
  return gulp.src(mainBowerFiles([['**/images/*.png']]))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('vendor', ['vendor-js', 'vendor-css', 'vendor-fonts', 'vendor-images']);

gulp.task('platform', ['templates', 'js', 'css', 'images']);

gulp.task('admin', ['admin-templates', 'admin-js', 'admin-css']);

gulp.task('compile', ['platform', 'admin', 'vendor']);
