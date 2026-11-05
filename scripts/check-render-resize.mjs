import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

test('opening to phone layout reuses physical-size buffers without an oversized intermediate allocation',async()=>{
  const {outputFiles}=await build({entryPoints:[fileURLToPath(new URL('../src/quality-renderer.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs'});
  const sandbox={module:{exports:{}},exports:{},devicePixelRatio:3,console,TextDecoder,TextEncoder,URL};sandbox.exports=sandbox.module.exports;
  vm.runInNewContext(outputFiles[0].text,sandbox);
  const {resizeQuality}=sandbox.module.exports;
  const allocations=[],composite=[];
  const renderer={capabilities:{maxTextureSize:16384,getMaxAnisotropy:()=>16},domElement:{style:{}},setDrawingBufferSize:(w,h,r)=>allocations.push([w,h,r])};
  const composer={setPixelRatio:r=>assert.equal(r,1),setSize:(w,h)=>composite.push([w,h])};
  const quality={scale:100,pixelRatio:2,transmission:1,anisotropy:16,antialias:'smaa'};
  const opening={clientWidth:1280,clientHeight:2560,dataset:{},getBoundingClientRect:()=>({width:400})};
  const phone={clientWidth:400,clientHeight:800,dataset:{},getBoundingClientRect:()=>({width:400})};
  const before=resizeQuality(renderer,composer,opening,quality),after=resizeQuality(renderer,composer,phone,quality);
  assert.equal(before.width,800);assert.equal(before.height,1600);
  assert.equal(after.width,before.width);assert.equal(after.height,before.height);
  assert.deepEqual(allocations,[[800,1600,1]]);
  assert.deepEqual(composite,[[800,1600]]);
  assert.equal(renderer.domElement.style.width,'400px');assert.equal(renderer.domElement.style.height,'800px');
  resizeQuality(renderer,composer,{...phone,clientWidth:600,getBoundingClientRect:()=>({width:600})},quality);
  assert.deepEqual(allocations.at(-1),[1200,1600,1]);assert.deepEqual(composite.at(-1),[1200,1600]);
});
