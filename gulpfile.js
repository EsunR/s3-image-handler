const del = require("del");
const { series, src, dest } = require("gulp");
const zip = require("gulp-zip");
const { exec } = require("child_process");

function clean() {
    return del(["dist/**/*"]);
}

function copy() {
    return src(["src/**/*", "package.json", "package-lock.json"]).pipe(
        dest("dist/")
    );
}

function installNpm() {
    return new Promise((resolve, reject) => {
        exec("npm install --production", { cwd: "dist/" }, (err, stdout) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
}

function zipDist() {
    return src("dist/**/*").pipe(zip("function.zip")).pipe(dest("./dist"));
}

function end(cb) {
    console.log("🎊 Build complete!");
    cb();
}

exports.default = series(clean, copy, installNpm, zipDist, end);
