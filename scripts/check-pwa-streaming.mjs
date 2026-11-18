import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

for(const file of ['cases/erste002/model.glb.bin','fonts/regular/test.woff2'])
test(`the worker streams ${file} while its cache write is still pending`,async()=>{
  const source=(await fs.readFile('scripts/pwa-worker.js','utf8'))
    .replace('__CACHE_VERSION__','"fixture"').replace('__PRECACHE_FILES__','[]')
    .replace('__DEFERRED_FILES__','["cases/erste002/model.glb.bin"]');
  const listeners={},background=[];
  let finishCache,putStarted=false;
  const pending=new Promise(resolve=>{finishCache=resolve});
  const cache={match:async()=>undefined,put:()=>{putStarted=true;return pending}};
  runInNewContext(source,{
    URL,Set,Request,Response,
    caches:{open:async()=>cache},fetch:async()=>new Response('streamed model'),
    self:{registration:{scope:'https://example.test/'},location:{origin:'https://example.test'},addEventListener:(type,fn)=>{listeners[type]=fn}},
  });
  let delivered;
  listeners.fetch({request:new Request('https://example.test/'+file),
    respondWith:response=>{delivered=response},waitUntil:promise=>background.push(promise)});
  let timer;
  try {
    const response=await Promise.race([delivered,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('The worker blocked delivery on the cache write')),200)})]);
    assert.equal(await response.text(),'streamed model');
    assert.equal(putStarted,true);assert.equal(background.length,1);
  }finally{clearTimeout(timer);finishCache();await Promise.all(background)}
});
