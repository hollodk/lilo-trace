import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import CleanCSS from 'clean-css';
import fs from 'fs';

function cssMinifier() {
    return {
        name: 'css-minifier',
        buildStart() {
            const input = 'src/css/style.css';
            const output = 'dist/style.min.css';
            const original = fs.readFileSync(input, 'utf8');
            const minified = new CleanCSS().minify(original).styles;

            fs.mkdirSync('dist', { recursive: true });
            fs.writeFileSync(output, minified);
        }
    };
}

export default [
    {
        input: 'src/js/validate.js',
        output: [
            {
                file: 'dist/lilo-trace.esm.js',
                format: 'es',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-trace.umd.js',
                format: 'umd',
                name: 'LiloTrace',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-trace.min.js',
                format: 'umd',
                name: 'LiloTrace',
                sourcemap: false,
                plugins: [terser()],
            }
        ],
        plugins: [
            cssMinifier(),
            copy({
                targets: [
                    { src: 'src/css/style.css', dest: 'dist' },
                    { src: 'src/js/validate.js', dest: 'dist', rename: 'validate.raw.js' }
                ],
                hook: 'buildStart'
            })
        ]
    }
];
