// generated on 2016-07-11 using generator-webapp 2.1.0
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const runSequence = require('run-sequence');
const util = require('gulp-util');
const checkCSS = require( 'gulp-check-unused-css' );
const server = require( 'gulp-develop-server' );

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('scripts-concat', function(){
  gulp.src(['app/scripts/main.js','app/scripts/*.js'])
    .pipe(concat('main.js'))
    .pipe(gulp.dest('app/scripts/final'));
});

gulp.task('scripts-compress', function(){
  gulp.src('app/scripts/final/main.js')
    .pipe(uglify({mangle: false}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('app/scripts/final'));

    });

gulp.task('styles', () => {
  gulp.src('app/styles/sass/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'));
    gulp.src('app/styles/sass/*.scss')
    .pipe($.sass({outputStyle:'compressed'}).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest('app/styles/css'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({stream: true}));
});

function lint(files, options) {
  return gulp.src(files)
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint(options))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js', {
    fix: true
  })
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js', {
    fix: true,
    env: {
      mocha: true
    }
  })
    .pipe(gulp.dest('test/spec/**/*.js'));
});

gulp.task('html', ['styles', 'scripts'], () => {
  gulp.src('app/*.html')
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('build/app'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src('app/fonts/**/*.{eot,svg,ttf,woff,woff2}')
    .pipe(gulp.dest('build/app/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', function (done) {
  del(['build'], done);
});

gulp.task('serve', ['styles','scripts-concat','scripts-compress', 'scripts', 'wiredep'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'app/*.html',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['scripts-concat', 'scripts-compress', 'scripts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});





gulp.task('serve:dist', function(callback) {
  runSequence('clean', ['js:server', 'templates','move:img','move:files','fonts'], callback);
});
gulp.task('serve:holder', function(callback) {
  runSequence('clean', ['js:server', 'holder','move:img','move:files','fonts'], callback);
});

gulp.task('js:server', function () {
  return gulp.src('server/index.js')
    .pipe($.sourcemaps.init())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('build'));
});

gulp.task('templates', function (){
  gulp.src('app/views/*.html')
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('build/app/views'));
  gulp.src('app/index.html')
    .pipe($.usemin({
      css: [ $.rev(), $.minifyCss() ],
      html: [ $.htmlmin({collapseWhitespace: true}) ],
      js: [$.ngAnnotate({add: true}), uglify({mangle:false}), $.rev() ],
      js2: [$.ngAnnotate({add: true}), uglify({mangle:false}), $.rev() ],
      inlinejs: [ uglify() ],
      inlinecss: [ $.minifyCss(), 'concat' ]
    }))
    .pipe(gulp.dest('build/app'));

});

gulp.task('holder', function (){
  gulp.src('app/views/*.html')
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('build/app/templates'));
  gulp.src('app/holder.html')
    .pipe($.usemin({
      css: [ $.rev(), $.minifyCss() ],
      html: [ $.htmlmin({collapseWhitespace: true}) ],
      js: [$.ngAnnotate({add: true}), uglify({mangle:false}), $.rev() ],
      js2: [$.ngAnnotate({add: true}), uglify({mangle:false}), $.rev() ],
      inlinejs: [ uglify() ],
      inlinecss: [ $.minifyCss(), 'concat' ]
    }))
    .pipe(gulp.dest('build/app'));

});

gulp.task('move:css', function (){
  gulp.src('app/styles/css/*.css')
  .pipe(gulp.dest('build/app/css'));

});

gulp.task('move:js', function (){
  gulp.src('app/scripts/final/*.js')
  .pipe(gulp.dest('build/app/js/final'));

});

gulp.task('move:img', function (){
  gulp.src('app/images/**')
  .pipe(gulp.dest('build/app/images'));
});

gulp.task('move:files', function (){
  gulp.src('./*.yaml')
  .pipe(gulp.dest('build'));
  gulp.src('./package.build.json')
  .pipe(rename('/build/package.json'))
  .pipe(gulp.dest('./'));

});

gulp.task('cleanCSS', function(){
  gulp.src(['app/styles/sass/*.scss', 'app/views/*.html'])
    .pipe(checkCSS());

});




gulp.task('server', () => {
  server.listen({
    path: './index.js',
    cwd: './build',
  });
});