// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        lib: {
            entry: './src/main.js',
            name: 'LiloApp',
            fileName: 'lilo-bundle',
            formats: ['umd'], // or 'iife' for direct browser loading
        },
        rollupOptions: {
            output: {
                globals: {
                    bootstrap: 'bootstrap'
                }
            }
        }
    }
});

