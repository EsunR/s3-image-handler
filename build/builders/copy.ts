import glob from "fast-glob";
import { DIST_DIR_PATH, PKGS_DIR_PATH } from "../constance";
import { dest, src } from "gulp";

export default async function copy() {
    const needCopyFiles = ["**/package.json", "**/.env"];
    const targetFiles = await glob(needCopyFiles, {
        cwd: PKGS_DIR_PATH,
        dot: true,
        ignore: ["**/node_modules/**", "types/**"],
        absolute: true,
        onlyFiles: true,
    });
    targetFiles.forEach((file) => {
        const targetPath = file
            .replace(PKGS_DIR_PATH, DIST_DIR_PATH)
            .split("/")
            .slice(0, -1)
            .join("/");
        src(file).pipe(dest(targetPath));
    });
}
