/**
 * Production isolation guard.
 *
 * 2026-11-06: the cassette now ships Draco-compressed in production, so decoder
 * strings are expected here; review-only code and review assets are not.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const assets = await fs.readdir('dist/assets');
const js = assets.filter((f) => f.endsWith('.js'));
assert.equal(js.length, 1, 'production must ship a single js bundle');

const code = await fs.readFile(path.join('dist/assets', js[0]), 'utf8');
for (const token of ['cassetteReview', 'review-assets/models', 'review-assets']) {
  assert.ok(!code.includes(token), `review-only code leaked into production: ${token}`);
}
assert.ok(
  code.includes('DRACOLoader') || code.includes('draco_decoder') || code.includes('draco_wasm_wrapper'),
  'production should decode the compressed cassette',
);

const model = await fs.readFile('public/assets/archive-cassette.glb');
const modelHash = createHash('sha256').update(model).digest('hex');
assert.equal(model.length, 529428, `cassette should be the Draco18 build, got ${model.length} bytes`);
const homeHtml = await fs.readFile('dist/index.html','utf8');
assert.ok(homeHtml.includes(`href="/assets/archive-cassette.${modelHash.slice(0,16)}.glb"`),
  'the original Draco18 model must start loading from HTML, before the application bundle');

const manifest = JSON.parse(await fs.readFile('dist/pwa-build.json', 'utf8'));
assert.ok(!manifest.files.some((f) => f.includes('review-assets')), 'precache must not carry review assets');
assert.ok(!manifest.files.some((f) => f.includes('_template')), 'precache must not carry the case template');
assert.ok(!manifest.precache.some((f) => f.endsWith('.woff2')), 'fonts stay runtime-cached');
assert.ok(manifest.deferred.some((f) => f.startsWith('assets/archive-assembly.')));
assert.ok(manifest.deferred.some((f) => f.endsWith('.glb.bin')));
assert.ok(manifest.deferred.some((f) => f.includes('/erste001/assets/opt/')));
assert.ok(manifest.precache.some((f) => /\/hero-1-\d+\.avif$/.test(f)));
assert.deepEqual([...manifest.precache, ...manifest.deferred].sort(), manifest.files);
assert.ok(manifest.precacheBytes < manifest.bytes);
assert.ok(manifest.precacheBytes < 4.5 * 1024 * 1024, 'optional resources must not grow the startup cache again');
assert.ok(manifest.deferred.includes('audio/atmosphere.ogg'));
assert.ok(manifest.deferred.some(f=>f.endsWith('/vendor/three.core.min.js')));
const caseRuntime = await fs.readFile('dist/cases/erste002/story-app.js','utf8');
assert.ok(!/^import\s/m.test(caseRuntime),'the 002 runtime must avoid the nested module waterfall');
assert.ok(caseRuntime.includes('EXT_meshopt_compression'),'the case runtime must decode the lossless model');

const distFiles = [];
const walk = async (dir) => {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else distFiles.push(full.replaceAll('\\', '/'));
  }
};
await walk('dist');
assert.ok(!distFiles.some((f) => f.includes('review-assets')), 'dist must not contain review assets');

console.log(
  JSON.stringify(
    {
      bundle: js[0],
      cassette: { bytes: model.length, sha256: modelHash.slice(0, 16) },
      precache: { files: manifest.precache.length, bytes: manifest.precacheBytes, version: manifest.version },
      productionIsolation: true,
    },
    null,
    2,
  ),
);
