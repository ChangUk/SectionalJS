import pkg from "./package.json";
import typescript from "@rollup/plugin-typescript";
import { uglify } from "rollup-plugin-terser";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

export default [{
    input: `src/${pkg.name}.ts`,
    output: {
        file: `dist/${pkg.name}.esm.js`,
        format: "esm"
    },
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            sourceMap: false
        }),
        terser()
    ]
}, {
    input: `src/${pkg.name}.ts`,
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            sourceMap: false
        }),
        terser()
    ],
    output: [{
        name: "sectional",
        file: `dist/${pkg.name}.umd.js`,
        format: "umd",
        plugins: getBabelOutputPlugin({
            allowAllFormats: true,
            presets: [
                ["@babel/preset-env", {
                    modules: "umd",
                    targets: { chrome: "58", ie: "11" },
                    useBuiltIns: "entry",
                    corejs: { version: 3, proposals: true },
                }]
            ],
        })
    }]
}];
