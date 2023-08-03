import fs from 'fs';
import { dest, parallel, src } from 'gulp';
import gulpZip from 'gulp-zip';
import path from 'path';
import { DIST_DIR_PATH } from '../constance';
import { withTaskName } from '../utils';

export default async function zip(cb: any) {
    // 分别单独将 DIST_DIR_PATH 的每个文件夹压缩成一个独立的 zip 压缩包
    const dirs = fs.readdirSync(DIST_DIR_PATH);
    parallel(
        dirs.map((dir) => {
            const dirPath = path.join(DIST_DIR_PATH, dir);
            return withTaskName(`zip ${dir}`, () =>
                src([`${dirPath}/**/*`, `${dirPath}/**/.*`])
                    .pipe(gulpZip(`${dir}.zip`))
                    .pipe(dest(DIST_DIR_PATH)),
            );
        }),
    )(cb);
}
