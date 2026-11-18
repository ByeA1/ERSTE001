import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { packStoryModel } from './pack-story-model.mjs';
const root=resolve('dist');
const casePath = 'cases/erste002';
const rawModel = `${casePath}/assets/shell-full.glb`;
const originalModel = await readFile(resolve(root, rawModel));
const optimizedModel = await packStoryModel(originalModel);
const modelHash = createHash('sha256').update(optimizedModel).digest('hex').slice(0, 16);
const packedModel = `assets/shell-full.${modelHash}.glb.bin`;
await writeFile(resolve(root, casePath, packedModel), gzipSync(optimizedModel, { level: 9 }));
const rawPreload = 'data-story-model href="./assets/shell-full.glb"';
for (const page of ['index.html', 'assembly.html']) {
  const casePage = resolve(root, casePath, page);
  const caseHtml = await readFile(casePage, 'utf8');
  if (!caseHtml.includes(rawPreload)) throw Error(`ERSTE002 model preload not found in ${page}`);
  await writeFile(casePage, caseHtml.replace(rawPreload, `data-story-model href="./${packedModel}"`));
}
const all=await readdir(root,{recursive:true});
// Files that must never sit in the install-time cache.
// - 753 MiSans shards (23 MB) are cached at runtime, the first time a page
//   actually asks for them, so a cold visit never downloads the whole family.
// - cases/_template is a development template: GitHub Pages (Jekyll) drops
//   directories that start with an underscore, so precaching it can only 404.
const excluded=path=>
  /^fonts\/.*\.woff2$/.test(path)||
  /^cases\/_template\//.test(path)||
  path === rawModel ||
  /^cases\/erste002\/assets\/shell-(?:full\.(?:rev2|vva-backup)|hi(?:\.three-part\.backup)?)\.glb$/.test(path)||
  /^assets\/archive-(cassette|assembly)\.glb$/.test(path);

const files=all.map(path=>path.replaceAll('\\','/')).filter(path=>
  path==='index.html'||path==='manifest.webmanifest'||path==='favicon.svg'||
  /^cases\/.*\.(html|css|js|wasm|avif|webp|png|jpe?g|svg|woff2|glb(?:\.bin)?|json)$/.test(path)||
  /^(assets|icons|archives|licenses)\/[^/]+\.[^/]+$/.test(path)||
  /^fonts\/.*\.(pdf|txt|json|md)$/.test(path)||
  /^audio\/(atmosphere|motif|pulse)\.ogg$/.test(path)
).filter(path=>!excluded(path)).sort();
const deferred = files.filter(path =>
  path === `${casePath}/${packedModel}` ||
  /^assets\/archive-assembly\.[a-f0-9]{16}\.glb$/.test(path) ||
  // Optional audio, font provenance and unused authoring/vendor modules should
  // not compete with a first visit. The case's bundled runtime stays atomic.
  /^audio\//.test(path) || /^fonts\//.test(path) ||
  (/^cases\/erste002\/vendor\//.test(path) &&
    !/\/draco\/(?:draco_wasm_wrapper\.js|draco_decoder\.wasm)$/.test(path)) ||
  (/^cases\/erste002\/[^/]+\.js$/.test(path) && !path.endsWith('/story-app.js')) ||
  (/^cases\/erste001\/assets\/opt\/.*\.(?:avif|webp|png|jpe?g)$/.test(path) &&
    !/\/hero-1-\d+\.avif$/.test(path))
);
const deferredSet = new Set(deferred);
const precache = files.filter(path => !deferredSet.has(path));

// Guard: a precache entry must exist in the build output, otherwise the whole
// release fails to install (that is what a stale cases/_template entry did).
const missing=[];
for(const file of files){
  try{await readFile(resolve(root,file))}catch{missing.push(file)}
}
if(missing.length)throw Error(`Precache lists files that are missing from dist: ${missing.join(', ')}`);
if(!files.some(path=>/^assets\/index-.*\.js$/.test(path)))throw Error('Build the application before generating the offline cache.');
const worker=await readFile('scripts/pwa-worker.js','utf8');
const hash=createHash('sha256').update(worker);let bytes=0, precacheBytes=0;
for(const file of files){
  const content=await readFile(resolve(root,file));
  hash.update(file).update(content);
  bytes+=content.length;
  if(!deferredSet.has(file))precacheBytes+=content.length;
}
hash.update(JSON.stringify(deferred));
const version=hash.digest('hex').slice(0,16);
await writeFile(resolve(root,'sw.js'),worker.replace('__CACHE_VERSION__',JSON.stringify(version))
  .replace('__PRECACHE_FILES__',JSON.stringify(precache))
  .replace('__DEFERRED_FILES__',JSON.stringify(deferred)));
await writeFile(resolve(root,'pwa-build.json'),JSON.stringify({version,bytes,files,precache,precacheBytes,deferred},null,2));
console.log(`Offline release ${version}: ${precache.length} startup files, ${(precacheBytes/1024/1024).toFixed(1)} MiB; ${deferred.length} files cached on use.`);
