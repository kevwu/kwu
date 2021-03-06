var gulp = require("gulp")
var scss = require("gulp-sass")
var babel = require("gulp-babel")
var rename = require("gulp-rename")
var sourcemaps = require("gulp-sourcemaps")

gulp.task("es6", function () {
		return gulp.src("./es6/*.js")
			.pipe(babel({
							presets: ['es2015'],
							sourceMaps: "inline",
						}))
			.on("error", swallowError)
			.pipe(gulp.dest("./static/js/"))
})

gulp.task("scss", function () {
		return gulp.src("./scss/*.scss")
			.pipe(sourcemaps.init())
			.pipe(scss().on("error", scss.logError))
			.pipe(sourcemaps.write())
			.pipe(rename({
							extname: ".css"
						}))
			.pipe(gulp.dest("./static/css/"))
})

gulp.task("watch", ["es6", "scss"], function () {
		gulp.watch("./scss/*.scss", ['scss'])
		gulp.watch("./es6/*.js", ['es6'])
})

// watch by default
gulp.task("default", ["watch"])

function swallowError(error) {
	console.log(error.toString())
 	this.emit('end')
}  
