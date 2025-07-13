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
    },
    {
        input: 'src/LiloApi.js',
        output: [
            {
                file: 'dist/lilo-api.esm.js',
                format: 'es',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-api.umd.js',
                format: 'umd',
                name: 'LiloApi',
                sourcemap: true,
            },
            {
                file: 'dist/lilo-api.min.js',
                format: 'umd',
                name: 'LiloApi',
                sourcemap: false,
                plugins: [terser()],
            }
        ],
        plugins: [
            copy({
                targets: [
                    { src: 'src/LiloApi.js', dest: 'dist', rename: 'lilo-api.raw.js' }
                ],
                hook: 'buildStart'
            })
        ]
    }
];
