import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import fs from 'fs';
import path from 'path';
import { OutputOptions, RollupOptions, rollup } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { DIST_DIR_PATH, PKGS_DIR_PATH } from '../constance';

export default async function compile() {
    const pkgDirNames = fs.readdirSync(PKGS_DIR_PATH);
    // 构建 packages 目录下的所有子包
    await Promise.all(
        pkgDirNames.map(async (pkgDirName) => {
            const rollupOption: RollupOptions = {
                input: path.join(PKGS_DIR_PATH, pkgDirName, 'index.ts'),
                plugins: [
                    alias({
                        entries: [
                            {
                                find: '@',
                                replacement: path.resolve(__dirname, '../../'),
                            },
                        ],
                    }),
                    nodeResolve({
                        extensions: ['.ts', '.js'],
                    }),
                    commonjs(),
                    esbuild({
                        sourceMap: true,
                        target: 'es2018',
                    }),
                ],
                external: [/node_modules/],
            };
            const outputOption: OutputOptions = {
                format: 'cjs',
                dir: path.join(DIST_DIR_PATH, pkgDirName),
                exports: 'named',
            };

            const bundle = await rollup(rollupOption);
            await bundle.write(outputOption);
        }),
    );
}
