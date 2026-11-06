import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const adjacent = path.join(here, 'site');
const root = path.resolve(process.argv[2] || ((await fs.stat(path.join(adjacent,'index.html')).catch(() => null)) ? adjacent : '.audit/model-logo/site'));
const port = Number(process.argv[3] || process.env.PORT || 4178);
const production = process.argv.includes('--production');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const cache = new Map();
export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (target !== root && !target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    // This preview deliberately has no Service Worker; production SW is untouched.
    if (url.pathname === '/sw.js' && !production) { res.writeHead(404).end(); return; }
    const file = (await fs.stat(target)).isDirectory() ? path.join(target, 'index.html') : target;
    const ext = path.extname(file);
    const gzip = /gzip/.test(req.headers['accept-encoding'] || '') && ['.glb', '.js', '.css', '.html', '.json', '.svg', '.wasm'].includes(ext);
    const key = file + gzip + (await fs.stat(file)).mtimeMs;
    let body = cache.get(key); if (!body) { const raw = await fs.readFile(file); body = gzip ? gzipSync(raw, { level: 9 }) : raw; cache.set(key, body); }
    const headers = { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'no-store', ...(gzip ? { 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' } : {}) };
    // Only the cassette model is shaped. Other files retain local speed. Explicit
    // query propagation avoids guessing profile from browser identity or hardware.
    if (url.searchParams.get('profile') === 'office' && ext === '.glb') {
      await new Promise(resolve => setTimeout(resolve, 1020)); res.writeHead(200, headers);
      const rate = 1256000 / 5.99, tick = 50, chunk = Math.round(rate * tick / 1000);
      const sendingAt = performance.now();
      for (let i = 0; i < body.length; i += chunk) { const due = Math.min(body.length,i+chunk)/rate*1000; await new Promise(resolve => setTimeout(resolve, Math.max(0,due-(performance.now()-sendingAt)))); if (res.destroyed) return; res.write(body.subarray(i, i + chunk)); }
      res.end();
    } else res.writeHead(200, headers).end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`ERSTE preview: http://127.0.0.1:${port}/reviews/model-logo/ (local only)`));
