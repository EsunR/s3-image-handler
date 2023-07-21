import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { DIST_DIR_PATH } from "../constance";

export default async function install() {
    const dirs = fs.readdirSync(DIST_DIR_PATH);
    const npmInstall = promisify(exec);
    await Promise.all(
        dirs.map(async (dir) => {
            const dirPath = path.join(DIST_DIR_PATH, dir);
            const { stderr, stdout } = await npmInstall(
                "npm install --production",
                {
                    cwd: dirPath,
                },
            );
            if (stderr) {
                console.log(stderr);
            }
            if (stdout) {
                console.log(stdout);
            }
        }),
    );
}
