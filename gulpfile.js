const del = require("del");
const { series, src, dest, parallel } = require("gulp");
const zip = require("gulp-zip");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

function clean() {
    return del(["dist/**/*", "dist/**/.*"]);
}

function copy(cb) {
    const envPath = path.resolve(__dirname, ".env.prod");
    const defaultCopyAction = () =>
        src(["src/**/*", "package.json", "package-lock.json"]).pipe(
            dest("dist/")
        );
    if (fs.existsSync(envPath)) {
        const copyEnv = () => src(envPath).pipe(dest("./dist"));
        parallel(copyEnv, defaultCopyAction)(cb);
    } else {
        return defaultCopyAction();
    }
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
    return src(["dist/**/*", "dist/**/.*"])
        .pipe(zip("function.zip"))
        .pipe(dest("./dist"));
}

function end(cb) {
    console.log("🎊 Build complete!");
    cb();
}

exports.default = series(clean, copy, installNpm, zipDist, end);
