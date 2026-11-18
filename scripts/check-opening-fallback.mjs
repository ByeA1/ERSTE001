import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {preview} from 'vite';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({serviceWorkers:'block'});
 const fast=process.env.OPENING_PROFILE==='super';
 await context.addInitScript(fast=>{
   if(fast)localStorage.setItem('tony-design-settings',JSON.stringify({superPerformance:true,sound:false,music:false}));
 },fast);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Leave the requests pending, rather than returning artificial errors.
 await page.route('**/fonts/**',()=>{});
 await page.route('**/*hero*.webp',()=>{});
 const url=`http://127.0.0.1:${server.httpServer.address().port}/`;
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.rhine?.stats().ready&&window.rhine.stats().renderedFrames>0,null,{timeout:15000});
 const result=await page.evaluate(()=>({
   elapsed:performance.now(),fontStatus:document.fonts.status,
   ready:window.rhine.stats().ready,frames:window.rhine.stats().renderedFrames,
   phase:document.querySelector('#stage').dataset.openingPhase,
   text:document.querySelector('.opening-status').textContent,
   failed:document.querySelector('.opening-status').dataset.failed,
   superPerformance:window.rhine.stats().superPerformance,
 }));
 assert.equal(result.fontStatus,'loading');assert.equal(result.failed,'');
 assert.equal(result.phase,'archive');assert.ok(result.frames>0);assert.deepEqual(errors,[]);
 assert.equal(result.superPerformance,fast);
 await mkdir('.audit/perf-20261114',{recursive:true});
 await writeFile(`.audit/perf-20261114/opening-fallback${fast?'-super':''}.json`,JSON.stringify({...result,errors},null,2));
 console.log('A stalled font/cover server does not block the real 3D opening:',result);
 await context.close();
}finally{await browser.close();server.httpServer.closeAllConnections();await new Promise(r=>server.httpServer.close(r))}
