import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const root=resolve('dist');
const all=await readdir(root,{recursive:true});
// Files that must never sit in the install-time cache.
// - 753 MiSans shards (23 MB) are cached at runtime, the first time a page
//   actually asks for them, so a cold visit never downloads the whole family.
// - cases/_template is a development template: GitHub Pages (Jekyll) drops
//   directories that start with an underscore, so precaching it can only 404.
const excluded=path=>
  /^fonts\/.*\.woff2$/.test(path)||
  /^cases\/_template\//.test(path)||
  /^assets\/archive-(cassette|assembly)\.glb$/.test(path);

const files=all.map(path=>path.replaceAll('\\','/')).filter(path=>
  path==='index.html'||path==='manifest.webmanifest'||path==='favicon.svg'||
  /^cases\/.*\.(html|css|js|avif|webp|png|jpe?g|svg|woff2|glb|json)$/.test(path)||
  /^(assets|icons|archives|licenses)\/[^/]+\.[^/]+$/.test(path)||
  /^fonts\/.*\.(pdf|txt|json|md)$/.test(path)||
  /^audio\/(atmosphere|motif|pulse)\.ogg$/.test(path)
).filter(path=>!excluded(path)).sort();

// Guard: a precache entry must exist in the build output, otherwise the whole
// release fails to install (that is what a stale cases/_template entry did).
const missing=[];
for(const file of files){
  try{await readFile(resolve(root,file))}catch{missing.push(file)}
}
if(missing.length)throw Error(`Precache lists files that are missing from dist: ${missing.join(', ')}`);
if(!files.some(path=>/^assets\/index-.*\.js$/.test(path)))throw Error('Build the application before generating the offline cache.');
const worker=await readFile('scripts/pwa-worker.js','utf8');
const hash=createHash('sha256').update(worker);let bytes=0;
for(const file of files){const content=await readFile(resolve(root,file));hash.update(file).update(content);bytes+=content.length}
const version=hash.digest('hex').slice(0,16);
await writeFile(resolve(root,'sw.js'),worker.replace('__CACHE_VERSION__',JSON.stringify(version)).replace('__PRECACHE_FILES__',JSON.stringify(files)));
await writeFile(resolve(root,'pwa-build.json'),JSON.stringify({version,bytes,files},null,2));
console.log(`Offline release ${version}: ${files.length} files, ${(bytes/1024/1024).toFixed(1)} MiB.`);
