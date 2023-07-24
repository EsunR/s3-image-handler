import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { DIST_DIR_PATH } from "../constance";

export default async function install() {
    const dirs = fs.readdirSync(DIST_DIR_PATH);
    await Promise.all(
        dirs.map((dir) => {
            const dirPath = path.join(DIST_DIR_PATH, dir);
            return new Promise<void>((resolve, reject) => {
                const child = spawn("npm", ["install", "--production"], {
                    cwd: dirPath,
                });
                child.stdout.on("data", (data) => {
                    console.log(data.toString());
                });
                child.stderr.on("data", (data) => {
                    console.log(data.toString());
                });
                child.on("close", (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }),
    );
}
