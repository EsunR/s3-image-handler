import { DIST_DIR_PATH, PKGS_DIR_PATH } from "../constance";
import { excludeFiles } from "../utils";
import glob from "fast-glob";
import { RollupOptions, OutputOptions, rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";

export default async function compile() {
    const input = excludeFiles(
        await glob(["**/*.ts"], {
            cwd: PKGS_DIR_PATH,
            absolute: true,
            onlyFiles: true,
        }),
    );

    const rollupOption: RollupOptions = {
        input,
        plugins: [
            nodeResolve({
                extensions: [".ts", ".js"],
            }),
            commonjs(),
            esbuild({
                sourceMap: true,
                target: "es2018",
            }),
        ],
        external: [/node_modules/],
    };

    const outputOption: OutputOptions = {
        format: "cjs",
        dir: DIST_DIR_PATH,
        exports: "named",
        preserveModules: true,
    };

    const bundle = await rollup(rollupOption);

    return bundle.write(outputOption);
}
