import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default [
    {
        input: 'src/LiloWebSocketManager.js',
        output: [
            {
                file: 'dist/lilo-websocket-manager.esm.js',
                format: 'es',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-websocket-manager.umd.js',
                format: 'umd',
                name: 'LiloWebSocketManager',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-websocket-manager.min.js',
                format: 'umd',
                name: 'LiloWebSocketManager',
                sourcemap: false,
                plugins: [terser()],
            }
        ],
        plugins: [
            copy({
                targets: [
                    { src: 'src/LiloWebSocketManager.js', dest: 'dist', rename: 'lilo-websocket-manager.raw.js' }
                ],
                hook: 'buildStart'
            })
        ]
    }
];
