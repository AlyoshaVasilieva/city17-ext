import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript';

import {
    chromeExtension,
} from 'rollup-plugin-chrome-extension'

export default {
    input: 'src_proc/manifest.json',
    output: {
        dir: 'dist',
        format: 'esm',
    },
    plugins: [
        chromeExtension(),
        typescript(),
        resolve(),
    ],
}
