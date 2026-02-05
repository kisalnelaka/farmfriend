import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsDir: 'assets',
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        host: true, // Listen on all local IPs
        port: 8080
    }
});
