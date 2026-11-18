import { build } from 'vite';
import { resolve } from 'node:path';

// Author the case as small ES modules; ship one runtime instead of a multi-RTT
// import waterfall. Paths relative to the document (story/model/editor) stay put.
await build({
  configFile: false, publicDir: false, logLevel: 'warn',
  build: {
    outDir: 'dist', emptyOutDir: false, target: 'es2022',
    lib: { entry: resolve('public/cases/erste002/story-app.js'), formats: ['es'], fileName: () => 'cases/erste002/story-app.js' },
  },
});
