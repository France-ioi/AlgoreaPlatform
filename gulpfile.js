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
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var debug = require('gulp-debug');
var mainBowerFiles = require('main-bower-files');

gulp.task('css', function() {
  return gulp.src(['algorea.css','forum/forum.css','layout/*.css','groupAdmin/groupAdmin.css','profile/*.css'])
    //.pipe(sourcemaps.init())
    .pipe(minifyCSS())
    //.pipe(sourcemaps.write())
    .pipe(concat('algorea.min.css'))
    .pipe(gulp.dest(''));
});

gulp.task('admin-css', function() {
  return gulp.src(['admin/admin.css'])
    //.pipe(sourcemaps.init())
    .pipe(minifyCSS())
    //.pipe(sourcemaps.write())
    .pipe(concat('admin.min.css'))
    .pipe(gulp.dest('admin'));
});

gulp.task('js', function() {
  return gulp.src(['ext/inheritance.js','algorea.js','commonFramework/modelsManager/*.js','commonFramework/sync/*.js','shared/*.js','commonFramework/treeview/*.js','login/*.js','layout.js','navigation/*.js','profile/*.js','map/*.js','community/*.js','states.js','task/*.js','userInfos/*.js','forum/*.js','groupAdmin/*.js','contest/*.js','groupCodePrompt/*.js'])
    //.pipe(jshint())
    //.pipe(jshint.reporter('jshint-stylish'))
    //.pipe(sourcemaps.init())
    .pipe(uglify())
    //.pipe(sourcemaps.write())
    .pipe(concat('algorea.min.js'))
    .pipe(gulp.dest(''));
});

gulp.task('admin-js', function() {
  return gulp.src(['ext/inheritance.js','shared/models.js','shared/utils.js','commonFramework/modelsManager/*.js','commonFramework/sync/*.js','commonFramework/treeview/*.js','login/service.js','admin/itemsCtrl.js','admin/adminUserItemController.js', 'admin/groupsCtrl.js','task/*.js'])
//    .pipe(jshint())
//    .pipe(jshint.reporter('jshint-stylish'))
//    .pipe(sourcemaps.init())
    .pipe(uglify())
//    .pipe(sourcemaps.write())
    .pipe(concat('admin.min.js'))
    .pipe(gulp.dest('admin'));
});

gulp.task('templates', function () {
    return gulp.src(['**/*html','!bower_components{/*,/**}','!ext/**/*.html','!index*.html','!animation.html','!admin/**/*.html','!node_modules/**/*.html','!dist/**/*.html','!commonFramework/angularDirectives/*.html','!commonFramework/sync/*.html'])
        .pipe(templateCache({module: 'algorea'}))
        .pipe(gulp.dest(''));
});

gulp.task('admin-templates', function () {
    return gulp.src(['admin/**/*html','**/*html','!ext/**/*.html','!*.html','!profile/**/*.html','!admin/*.html','!forum/**/*.html','!userInfos/**/*.html','!community/**/*.html','!dist/**/*.html','!navigation/**/*.html','!node_modules/**/*.html','!commonFramework/sync/*.html'])
        .pipe(templateCache({module: 'algorea'}))
        .pipe(gulp.dest('admin'));
});

gulp.task('vendor-js', function() {
  // exclude bootstrap from included js, include fr_fr locale
  return gulp.src(mainBowerFiles({"filter": '**/*.js', "overrides": {"bootstrap": {"main": []}, "dynatree": {"dependencies": {"jquery-ui": "*"}}, "angular": {"dependencies": {"jquery": "*"}}, "angular-i18n": {"main": ['angular-locale_fr-fr.js'], "dependencies": {"angular":"*"}}}}))
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest(''));
});

gulp.task('vendor-css', function() {
  return gulp.src(mainBowerFiles({"filter": '**/*.css', "overrides": {"dynatree": {"main": ['dist/skin/ui.dynatree.css']}, "bootstrap": {"main": ['dist/css/bootstrap.css']}}}))
    .pipe(minifyCSS())
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest(''));
});

gulp.task('vendor-fonts', function() {
  return gulp.src(['bower_components/bootstrap/fonts/*'])
    .pipe(gulp.dest('fonts'));
});

gulp.task('dynatree-images', function() {
  return gulp.src('bower_components/dynatree/dist/skin/*.gif')
    .pipe(gulp.dest(''));
});

gulp.task('vendor-images', ['dynatree-images'], function() {
  return gulp.src(mainBowerFiles([['**/images/*.png']]))
    .pipe(gulp.dest('images'));
});

gulp.task('vendor', ['vendor-js', 'vendor-css', 'vendor-fonts', 'vendor-images']);

gulp.task('platform', ['templates', 'js', 'css']);

gulp.task('admin', ['admin-templates', 'admin-js', 'admin-css']);

gulp.task('compile', ['platform', 'vendor']);

gulp.task('default', ['platform', 'vendor']);
