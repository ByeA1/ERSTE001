// Production-build regression: Chrome/Edge, desktop/mobile, streamed model,
// complete story, free controls, pause/disposal, cached and offline re-entry.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('dist'),out=resolve('.audit/perf-20261114');await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.wasm':'application/wasm','.glb':'model/gltf-binary','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.png':'image/png','.ogg':'audio/ogg'};
let requests=[];
let revision=1,failCore=false;
const metadata=JSON.parse(await readFile(resolve(root,'pwa-build.json'),'utf8'));
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');const file=resolve(root,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
 if(!file.startsWith(root+sep))throw Error('path');
 if(failCore&&url.pathname==='/icons/icon-192.png'){res.writeHead(503).end();return;}
 let bytes=await readFile(file);const type=mime[extname(file)]||'application/octet-stream';const headers={'Content-Type':type,'Cache-Control':'no-cache'};
 if(url.pathname==='/sw.js'&&revision>1)bytes=Buffer.from(bytes.toString().replace(metadata.version,`${metadata.version}-test-${revision}`));
 if(/javascript|text\/|json|svg/.test(type)&&req.headers['accept-encoding']?.includes('gzip')){bytes=gzipSync(bytes);headers['Content-Encoding']='gzip'}
 requests.push({url:url.pathname,bytes:bytes.length});
 res.writeHead(200,{...headers,'Content-Length':bytes.length}).end(bytes);
 }catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const report={date:new Date().toISOString(),release:metadata.version,browsers:{},checks:[],errors:[]};
try {
 for(const channel of (process.env.REVIEW_CHANNELS||'chrome,msedge').split(',')){
  const browser=await chromium.launch({channel,headless:true,args:['--no-proxy-server']});
  report.browsers[channel]=browser.version();
  try {for(const size of (process.env.REVIEW_SIZES||'desktop,mobile').split(',')){
   const mobile=size==='mobile';
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1536,height:864},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1});
   context.setDefaultTimeout(15000);
   await context.addInitScript(()=>{
     window.__draws=0;
     const get=HTMLCanvasElement.prototype.getContext;
     HTMLCanvasElement.prototype.getContext=function(...args){
       const gl=get.apply(this,args);if(args[0]!=='webgl2'||!gl||gl.__counted)return gl;
       gl.__counted=true;
       for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
         const draw=gl[name];gl[name]=function(...args){window.__draws++;return draw.apply(this,args)};
       }return gl;
     };
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   try {
    requests=[];revision=1;failCore=false;
    await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.rhine?.stats().ready,null,{timeout:45000});
    await page.waitForFunction(()=>document.querySelector('#stage')?.dataset.mode==='detail',null,{timeout:45000});
    const trace=await page.locator('#stage').evaluate(el=>JSON.parse(el.dataset.openingTrace));
    assert.deepEqual(trace.map(t=>t.phase),['loading','authorization','welcome','archive']);
    assert.ok(Math.abs(trace[1].time-3)<.15&&Math.abs(trace[2].time-4.8)<.15&&Math.abs(trace[3].time-8.94)<.15);
    await page.waitForFunction(()=>document.documentElement.dataset.offlineReady==='true'&&navigator.serviceWorker.controller,null,{timeout:90000});
    const initial={requests:requests.length,bytes:requests.reduce((n,r)=>n+r.bytes,0)};
    console.log(channel,size,'opening and cache ready');
    await page.locator('#stage .back-button').click();
    await page.waitForFunction(()=>window.rhine.stats().mode==='archive');
    await page.waitForFunction(()=>window.rhine.stats().cameraDetail<.1);
    console.log(channel,size,'archive returned');
    const before=await page.evaluate(()=>window.rhine.stats().selectedCell);
    const canvas=page.locator('#three-scene canvas'),box=await canvas.boundingBox();
    await page.mouse.move(box.x+box.width*.6,box.y+box.height*.6);await page.mouse.down();
    await page.mouse.move(box.x+box.width*.3,box.y+box.height*.6,{steps:12});await page.mouse.up();
    await page.waitForTimeout(700);
    const after=await page.evaluate(()=>window.rhine.stats().selectedCell);
    assert.notDeepEqual(after,before,'Dragging the archive still changes the physical selection');
    console.log(channel,size,'archive drag passed');
    await page.evaluate(()=>window.DesignTerminal.openProject('erste002'));
    await page.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open',null,{timeout:60000});
    const frame=page.frames().find(f=>f.url().includes('/cases/erste002/index.html'));assert.ok(frame);
    await frame.waitForFunction(()=>document.body.dataset.projectReady==='ready'&&window.__draws>0,null,{timeout:15000});
    console.log(channel,size,'002 drew its first frame');
    await frame.waitForFunction(()=>document.body.dataset.playing==='false',null,{timeout:15000});
    const still=await frame.evaluate(()=>window.__draws);await page.waitForTimeout(350);
    assert.equal(await frame.evaluate(()=>window.__draws),still,'A held shot must stop drawing');
    await frame.locator('#next-chapter').click();
    await frame.waitForFunction(()=>document.body.dataset.playing==='true');
    await frame.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
    const hidden=await frame.evaluate(()=>({draws:window.__draws,p:document.body.dataset.progress}));await page.waitForTimeout(350);
    assert.deepEqual(await frame.evaluate(()=>({draws:window.__draws,p:document.body.dataset.progress})),hidden,'A simulated visibility loss must suspend rendering and the story clock');
    await frame.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
    await frame.waitForFunction(()=>document.body.dataset.playing==='false',null,{timeout:15000});
    await frame.locator('#mode').click();
    const freeBox=await frame.locator('canvas').boundingBox();const draws=await frame.evaluate(()=>window.__draws);
    await page.mouse.move(freeBox.x+freeBox.width*.55,freeBox.y+freeBox.height*.45);await page.mouse.down();
    await page.mouse.move(freeBox.x+freeBox.width*.7,freeBox.y+freeBox.height*.5,{steps:10});await page.mouse.up();
    await page.waitForTimeout(500);assert.ok(await frame.evaluate(()=>window.__draws)>draws,'Free orbit must draw');
    await frame.locator('#free-tools > summary').click();
    await frame.locator('#part').selectOption('shell_top');await frame.locator('#extract-part').click();await page.waitForTimeout(900);
    await frame.locator('#isolate-part').click();await frame.waitForFunction(()=>document.querySelector('#scene-root').dataset.isolated==='shell_top');
    await frame.locator('#reset').click();await page.waitForTimeout(900);
    assert.equal(await frame.locator('#scene-root').getAttribute('data-isolated'),'');
    for(const tier of ['low','medium','high']){
      await page.evaluate(tier=>{const f=document.querySelector('iframe[data-project-id="erste002"]');f.contentDocument.documentElement.dataset.terminalPerformanceMode='high';f.contentDocument.documentElement.dataset.terminalQuality=tier;f.contentWindow.postMessage({type:'design-terminal:case-policy',reduced:false,tier,performanceMode:'high'},location.origin)},tier);
      await frame.waitForFunction(tier=>document.querySelector('#scene-root').dataset.adaptiveTier===tier,tier);
      const pixels=await frame.locator('canvas').evaluate(el=>el.width*el.height);
      assert.ok(pixels<=(tier==='low'?750000:tier==='medium'?1050000:1450000)+3000);
    }
    await page.locator('.project-case [data-terminal-language="en"]').click();await frame.waitForFunction(()=>document.documentElement.lang==='en');
    await page.emulateMedia({reducedMotion:'reduce'});
    await frame.locator('#mode').click();
    let cut=false,count=0;
    while(!(await frame.locator('#restart-story').isVisible())&&count++<25){
      await frame.locator('#next-chapter').click();await frame.waitForFunction(()=>document.body.dataset.playing==='false');
      cut ||= await frame.locator('body').getAttribute('data-cut')==='true';
    }
    assert.ok(cut,'The real rib-section shot still renders');assert.ok(count<25);
    await frame.locator('#restart-story').click();await frame.waitForFunction(()=>Number(document.body.dataset.progress)<.1);
    await page.screenshot({path:resolve(out,`runtime-${channel}-${mobile?'mobile':'desktop'}.png`)});
    assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open);
    await page.locator('iframe[data-project-id="erste002"]').waitFor({state:'detached'});
    const modelsBefore=requests.filter(r=>r.url.endsWith('.glb.bin')).length;
    await context.setOffline(true);
    await page.evaluate(()=>window.DesignTerminal.openProject('erste002'));
    await page.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open',null,{timeout:30000});
    const offline=page.frames().find(f=>f.url().includes('/cases/erste002/index.html'));
    await offline.waitForFunction(()=>document.body.dataset.projectReady==='ready'&&window.__draws>0);
    assert.equal(requests.filter(r=>r.url.endsWith('.glb.bin')).length,modelsBefore,'Used models must re-open from the worker cache offline');
    await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open);
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.rhine?.stats().ready,null,{timeout:45000});
    if(!mobile){
      await context.setOffline(false);
      await page.evaluate(()=>{localStorage.setItem('tony-design-saved','["X-001"]');window.rhine.archive()});
      revision=2;
      await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update()});
      await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.waiting),null,{timeout:60000});
      await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#pwa-update-notice [data-pwa-action="update"]').click()]);
      await page.waitForFunction(()=>window.rhine?.stats().ready,null,{timeout:45000});
      assert.equal(await page.evaluate(()=>localStorage.getItem('tony-design-saved')),'["X-001"]');
      assert.ok(await page.evaluate(()=>window.rhine.stats().saved.includes('X-001')));
      await page.waitForFunction(async()=>Boolean((await caches.keys()).some(k=>k.endsWith('-test-2'))));
      revision=3;failCore=true;
      await page.evaluate(async()=>{
        const r=await navigator.serviceWorker.getRegistration();await r.update();const installing=r.installing;
        if(installing&&!['installed','redundant'].includes(installing.state))await new Promise(resolve=>installing.addEventListener('statechange',()=>{if(['installed','redundant'].includes(installing.state))resolve()}));
      });
      await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.rhine?.stats().ready,null,{timeout:45000});
      const keys=await page.evaluate(()=>caches.keys());
      assert.ok(keys.some(k=>k.endsWith('-test-2')));assert.ok(!keys.some(k=>k.endsWith('-test-3')));
      failCore=false;
    }
    assert.deepEqual(errors,[]);
    report.checks.push({channel,mobile,initial,openingTrace:trace,storyShots:count,section:cut,offlineModel:true,archiveDrag:true,freeOrbit:true,qualityTiers:true,simulatedVisibility:true,disposedOnClose:true,atomicUpdate:!mobile,failedUpdateRecovery:!mobile,errors});
    console.log(`${channel} ${mobile?'mobile':'desktop'}: opening, dragging, story, section, orbit, quality, language, pause, offline re-entry passed`);
   } catch(error){report.errors.push({channel,mobile,error:error.stack,console:errors});console.error(channel,mobile,error.message);await page.screenshot({path:resolve(out,`runtime-${channel}-${mobile}-failure.png`)}).catch(()=>{})}
   finally{
    await context.close();await writeFile(resolve(out,'runtime-checks.json'),JSON.stringify(report,null,2));
    await writeFile(resolve(out,`runtime-checks-${channel}-${size}.json`),JSON.stringify({release:metadata.version,browser:browser.version(),checks:report.checks.filter(c=>c.channel===channel&&c.mobile===mobile),errors:report.errors.filter(c=>c.channel===channel&&c.mobile===mobile)},null,2));
   }
  }}finally{await browser.close()}
 }
}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
assert.deepEqual(report.errors,[]);
