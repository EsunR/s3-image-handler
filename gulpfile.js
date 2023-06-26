const del = require("del");
const { series, src, dest } = require("gulp");
const zip = require("gulp-zip");

function clean(cb) {
    del(["dist/**/*"]);
    cb();
}

function copy(cb) {
    src(["src/**/*", "package.json", "package-lock.json"]).pipe(dest("dist/"));
    cb();
}

function zipDist(cb) {
    // src("dist/*").pipe(zip("function.zip")).pipe(dest("./"));
    src("dist/**/*").pipe(zip("function.zip")).pipe(dest("./"));
    cb();
}

exports.default = series(clean, copy, zipDist);
