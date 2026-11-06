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

const manifest = JSON.parse(await fs.readFile('dist/pwa-build.json', 'utf8'));
assert.ok(!manifest.files.some((f) => f.includes('review-assets')), 'precache must not carry review assets');
assert.ok(!manifest.files.some((f) => f.includes('_template')), 'precache must not carry the case template');
assert.ok(!manifest.files.some((f) => f.endsWith('.woff2')), 'fonts stay runtime-cached');

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
      precache: { files: manifest.files.length, bytes: manifest.bytes, version: manifest.version },
      productionIsolation: true,
    },
    null,
    2,
  ),
);
