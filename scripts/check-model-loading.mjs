import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { packStoryModel } from './pack-story-model.mjs';
import { loadStoryModel } from '../public/cases/erste002/model-load.js';

const raw = await fs.readFile('public/cases/erste002/assets/shell-full.glb');
const packed = await packStoryModel(raw);
const buffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
test('lossless story compression preserves every vertex, colour, index and node transform', async () => {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const [a,b] = await Promise.all([loader.parseAsync(buffer(raw), ''),loader.parseAsync(buffer(packed), '')]);
  const collect = root => {const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o)});return meshes};
  const before=collect(a.scene), after=collect(b.scene);
  assert.equal(before.length,after.length);
  assert.ok(gzipSync(packed).length < gzipSync(raw).length * .75);
  for(let i=0;i<before.length;i++){
    assert.equal(after[i].name,before[i].name);
    assert.deepEqual(after[i].matrix.elements,before[i].matrix.elements);
    assert.deepEqual(after[i].geometry.index.array,before[i].geometry.index.array);
    assert.deepEqual(Object.keys(after[i].geometry.attributes),Object.keys(before[i].geometry.attributes));
    for(const key of Object.keys(before[i].geometry.attributes))
      assert.deepEqual(after[i].geometry.attributes[key].array,before[i].geometry.attributes[key].array,key);
  }
});

test('packed model loading handles corrupt payloads, browser decoding, cancellation and raw fallback', async t => {
  const globals = Object.fromEntries(['fetch','document','location'].map(k=>[k,globalThis[k]]));
  const href='https://local.test/cases/erste002/assets/test.glb.bin';
  globalThis.document={querySelector:()=>({href}),body:{dataset:{}}};
  globalThis.location={href:'https://local.test/cases/erste002/index.html'};
  try {
    for(const scenario of ['gzip','decoded','invalid-gzip','invalid-glb','parse-failure','http-failure','no-decompression']) await t.test(scenario,async()=>{
      const requests=[];let parses=0;
      const decompression=globalThis.DecompressionStream;
      if(scenario==='no-decompression')globalThis.DecompressionStream=undefined;
      globalThis.fetch=async url=>{
        requests.push(String(url));
        if(String(url)!==href)return new Response(raw);
        if(scenario==='http-failure')return new Response('missing',{status:404});
        if(scenario==='invalid-gzip')return new Response('not gzip');
        if(scenario==='invalid-glb')return new Response(gzipSync(Buffer.from('not glb')));
        return new Response(scenario==='decoded'?packed:gzipSync(packed));
      };
      const loader={setMeshoptDecoder(){},parseAsync(bytes){parses++;if(scenario==='parse-failure'&&parses===1)throw Error('bad glb');assert.equal(new DataView(bytes).getUint32(0,true),0x46546c67);return Promise.resolve('ready')}};
      try {
        assert.equal(await loadStoryModel(loader,new AbortController().signal),'ready');
        assert.equal(requests.at(-1),['gzip','decoded'].includes(scenario)?href:'./assets/shell-full.glb');
      } finally {globalThis.DecompressionStream=decompression;}
    });
    await t.test('cancel never falls back to a second large download',async()=>{
      let requests=0;const controller=new AbortController();
      globalThis.fetch=async()=>{requests++;controller.abort();throw new DOMException('cancel','AbortError')};
      await assert.rejects(loadStoryModel({setMeshoptDecoder(){}},controller.signal),{name:'AbortError'});
      assert.equal(requests,1);
    });
  } finally {Object.assign(globalThis,globals)}
});

test('production packed model is the deterministic lossless output',async()=>{
  const html=await fs.readFile('dist/cases/erste002/index.html','utf8');
  const filename=html.match(/data-story-model href="\.\/([^\"]+)"/)[1];
  assert.deepEqual(gunzipSync(await fs.readFile('dist/cases/erste002/'+filename)),packed);
});
