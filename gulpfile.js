const { dest, src, parallel, series, watch } = require('gulp');
const clean = require('gulp-clean');
const cleanCSS = require('gulp-clean-css');
const noop = require('gulp-noop');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const webserver = require('gulp-webserver');

const outputCss = './public/css';
const isDevelopment = process.env.NODE_ENV === 'development';

function limpiarCss(){
  return src([`${outputCss}/*.css`, `${outputCss}/*.scss`])
    .pipe(clean())
}

function limpiarJs(){
  return src(`public/js/**`)
    .pipe(clean())
}

function compilarSass(){
  return src('./sass/**/*.scss')
    .pipe(isDevelopment ? sourcemaps.init() : noop())
    .pipe(sass().on('error', sass.logError))
    .pipe(isDevelopment ? sourcemaps.write() : noop())
    .pipe(dest(outputCss));
}

function copiarSass(){
  return src('./sass/**/*.scss')
    .pipe(dest(outputCss));
}

function minificarCss(){
  return src(`${outputCss}/*.css`)
    .pipe(cleanCSS({debug: true}, (details) => {
      console.log(`${details.name}: ${details.stats.originalSize}`);
      console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(dest(outputCss));
}

function minificarJs(){
  return src('./js/index.js')
    .pipe(uglify({
        mangle: true
    }))
    .pipe(dest('./public/js'))
}

function copiarJs(){
  return src('./js/index.js')
    .pipe(dest('./public/js'))
}

function copiarHtml(){
  return src('index.html')
    .pipe(dest('public'));
}

function iniciarServidor(){
  return src('public')
    .pipe(webserver({
      livereload: true, //aplicar los cambios con cada cambio de archivo servido en "public"
      open: false //define si abre el navegador o no
    }));
}

const correrTareasJs = series([limpiarJs, minificarJs]);
const correrTareasCss = series([limpiarCss, compilarSass, minificarCss]);

const correrTareasJsDev = series([limpiarJs, copiarJs]);
const correrTareasCssDev = series([limpiarCss, compilarSass, copiarSass]);

const tareasDev = series([parallel([correrTareasJsDev, correrTareasCssDev, copiarHtml]), iniciarServidor]);
const tareasProd = series([parallel([correrTareasJs, correrTareasCss, copiarHtml]), iniciarServidor]);

watch(['./js/*.js'], {usePolling: true}, isDevelopment ? correrTareasJsDev : correrTareasJs);
watch(['./sass/*.scss'], {usePolling: true}, isDevelopment ? correrTareasCssDev : correrTareasCss);
watch(['./index.html'], {usePolling: true}, copiarHtml);

exports.js = correrTareasJs;
exports.css = correrTareasCss;

//el export por default es el que se ejecuta cuando corremos solamente "gulp"
exports.default = isDevelopment ? tareasDev : tareasProd;
