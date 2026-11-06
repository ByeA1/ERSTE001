import { build } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
const out = path.resolve('.audit/model-logo/site');
await build({ mode: 'model-review', build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { home: path.resolve('index.html'), review: path.resolve('reviews/model-logo/index.html') } } } });
await fs.mkdir(path.join(out, 'review-assets/models'), { recursive: true });
await fs.cp('.audit/model-logo/models', path.join(out, 'review-assets/models'), { recursive: true });
await fs.copyFile('scripts/serve-cassette-review.mjs', '.audit/model-logo/serve.mjs');
console.log('Preview built: node .audit/model-logo/serve.mjs → http://127.0.0.1:4178/reviews/model-logo/');
