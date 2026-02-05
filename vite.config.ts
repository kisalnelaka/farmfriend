import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsDir: 'assets',
        outDir: 'dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 2000,
    },
    server: {
        host: true,
        port: 8080
    }
});
