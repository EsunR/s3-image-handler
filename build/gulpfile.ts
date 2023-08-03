import { series } from 'gulp';
import { withTaskName } from './utils';
import del from 'del';
import { DIST_DIR_PATH } from './constance';
import compile from './builders/compile';
import copy from './builders/copy';
import install from './builders/install';
import zip from './builders/zip';

export default series(
    withTaskName('clean dist', () => del(DIST_DIR_PATH, { force: true })),
    withTaskName('compile packages', compile),
    withTaskName('copy files', copy),
    withTaskName('install dependence', install),
    withTaskName('zip files', zip),
);
