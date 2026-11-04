import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../preview/lab',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
