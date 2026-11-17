import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chapters,topics,productToTopic} from '../public/cases/erste002/engineering-content.js';
const {chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const origin=process.env.ERSTE_ORIGIN||'http://127.0.0.1:5207';
const out=process.env.ERSTE_EVIDENCE_OUT||'docs/erste002-engineering-evidence';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),report={browser:'Microsoft Edge / Chromium, real headless browser',origin,started:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const check=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS '+name)};
const open=async(page,hash='')=>{await page.goto(origin+'/cases/erste002/index.html'+hash);await page.locator('#topic-overview').waitFor({state:'attached'});await page.waitForFunction(()=>document.body.dataset.projectReady!=='loading');};
const settled=async page=>{await page.waitForFunction(()=>!document.querySelector('#next-chapter').hasAttribute('aria-busy'));};
const route=async(page,expected)=>assert.equal(await page.locator('body').getAttribute('data-route'),expected);
const shot=async(page,n)=>{await settled(page);assert.ok((await page.locator('#chapter-number').textContent()).startsWith(String(n).padStart(2,'0')));};
async function aligned(page,id){
 await page.waitForFunction(id=>location.hash==='#engineering/'+id,id);
 const rect=await page.locator('#topic-'+id).evaluate(el=>{const root=document.querySelector('#scroller'),first=el===el.closest('.e-chapter').querySelector('[data-topic]'),dest=first?el.closest('.e-chapter').querySelector('.e-chapter-header'):el;return{top:dest.getBoundingClientRect().top-root.getBoundingClientRect().top,scroll:root.scrollTop,max:root.scrollHeight-root.clientHeight}});
 assert.ok(Math.abs(rect.top-24)<4||rect.scroll===0||(rect.scroll>=rect.max-2&&rect.top>=0&&rect.top<=90),`${id} aligned: ${JSON.stringify(rect)}`);
}
async function capture(page,name){
 for(const frame of page.frames())await frame.evaluate(async()=>{
  const visible=[...document.querySelectorAll('#engineering img,.process-image img')].filter(i=>{const r=i.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.width>0&&getComputedStyle(i).visibility!=='hidden'});
  await Promise.all(visible.map(i=>i.decode()));
 });
 const file=name+'.jpg';await page.screenshot({path:out+'/'+file,type:'jpeg',quality:88});report.screenshots.push(file);
}
try{
 const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 const modelRequests=[];page.on('request',r=>{if(r.url().includes('/assets/shell-full'))modelRequests.push(r.url());});
 await open(page);await settled(page);await page.locator('.route-entrance').waitFor();
 const canvas=await page.locator('#scene-root canvas').elementHandle();assert.ok(canvas);
 await capture(page,'desktop-product-opening');
 const openingBounds=await page.evaluate(()=>{const a=document.querySelector('#caption').getBoundingClientRect(),b=document.querySelector('.route-entrance').getBoundingClientRect();return{caption:a.toJSON(),entrance:b.toJSON(),overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}});assert.equal(openingBounds.overlap,false);check('Shared opening and both route entrances',{openingBounds});
 for(let n=1;n<=11;n++){
  await shot(page,n);
  await page.locator('.route-related').click();await route(page,'engineering');await aligned(page,productToTopic[n-1]);
  await page.locator(`#topic-${productToTopic[n-1]} [data-related-product]`).click();await route(page,'product');await shot(page,n);
  assert.equal(await page.evaluate(el=>document.querySelector('#scene-root canvas')===el,canvas),true);
  if(n<11){await page.locator('#next-chapter').click();await settled(page);}
 }
 assert.equal(modelRequests.length,1);check('All 11 product → exact engineering topics → related product shots',{modelLoads:modelRequests.length,reusedCanvas:true});
 await page.locator('#restart-story').click();await shot(page,1);await page.locator('[data-explore-product]').click();await shot(page,2);check('Explore Product continues at shot 02; product restart returns to shot 01');
 await page.locator('.route-related').click();await aligned(page,'grip');
 for(const t of topics){
  // Topic links are real anchors; assigning a fragment exercises public deep-link navigation.
  await page.goto(origin+'/cases/erste002/index.html#engineering/'+t.id);await page.locator('#topic-'+t.id).waitFor({state:'attached'});await aligned(page,t.id);
  await page.locator(`#topic-${t.id} [data-related-product]`).click();await route(page,'product');await shot(page,t.shot);
 }
 check('All 15 engineering topics link to their configured product shot');
 await page.goto(origin+'/cases/erste002/index.html#engineering/packaging');await aligned(page,'packaging');
 const prior=await page.locator('#scroller').evaluate(el=>el.scrollTop);
 await page.locator('.route-related').click();await shot(page,6);
 await page.goBack();await aligned(page,'packaging');assert.ok(Math.abs(await page.locator('#scroller').evaluate(el=>el.scrollTop)-prior)<4);
 await page.goForward();await route(page,'product');await shot(page,6);
 await page.locator('.route-related').click();await aligned(page,'assembly');
 check('Browser Back / Forward restores engineering topic and scroll; active mapping overrides saved history');
 await page.reload();await page.locator('#topic-assembly').waitFor({state:'attached'});await aligned(page,'assembly');check('Refresh restores the current engineering topic');
 await page.locator('.route-related').click();await shot(page,6);await page.locator('.route-saved').click();await aligned(page,'assembly');
 await page.locator('.route-saved').click();await shot(page,6);check('Independent saved route positions and explicit resume');
 await page.locator('.route-related').click();
 await page.locator('.archive-index [data-engineering-topic="overview"]').click();
 for(let i=0;i<4;i++){
  const first=topics.find(t=>t.chapter===chapters[i].id);await aligned(page,first.id);
  await capture(page,'desktop-chapter-0'+(i+1));
  if(i<3)await page.locator('[data-engineering-next]').click();
 }
 assert.equal(await page.locator('[data-engineering-next]').isDisabled(),true);
 for(let i=2;i>=0;i--){await page.locator('[data-engineering-prev]').click();await aligned(page,topics.find(t=>t.chapter===chapters[i].id).id);}
 assert.equal(await page.locator('[data-engineering-prev]').isDisabled(),true);check('Four chapters browse linearly forward and backward with correct bounds and progress');
 await page.goto(origin+'/cases/erste002/index.html#engineering/comparison');await page.locator('#topic-comparison .e-photo').scrollIntoViewIfNeeded();await capture(page,'desktop-three-prototypes');
 await page.goto(origin+'/cases/erste002/index.html#engineering/overview');await aligned(page,'overview');
 await page.locator('[data-photo="P4241"]').first().click();await page.locator('.archive-dialog').waitFor();
 assert.ok((await page.locator('.archive-dialog figcaption').textContent()).includes('IMG_4241'));
 await page.locator('[data-photo-step="1"]').click();assert.ok((await page.locator('.archive-dialog figcaption').textContent()).includes('IMG_4242'));
 await page.keyboard.press('ArrowLeft');assert.ok((await page.locator('.archive-dialog figcaption').textContent()).includes('IMG_4241'));
 await page.keyboard.press('Escape');assert.equal(await page.locator('.archive-dialog').isVisible(),false);assert.equal(await page.locator('[data-photo="P4241"]').first().evaluate(el=>el===document.activeElement),true);
 check('Photo enlargement, sequence, arrow keys, Escape and focus restoration');
 await page.goto(origin+'/cases/erste002/index.html#engineering/reinforcement');await aligned(page,'reinforcement');
 for(let i=0;i<4;i++){await page.locator(`[data-cad="${i}"]`).click();assert.ok((await page.locator('#engineering-cad-image').getAttribute('src')).includes(`p0${i+1}`));await page.locator('#engineering-cad-image').evaluate(img=>img.decode());}
 await capture(page,'desktop-cad-comparison');check('Four archival CAD packages compare with traceable provisional identities');
 // Decode every selected photograph without relying on lazy-image scroll proximity.
 const images=await page.evaluate(async()=>{const sources=[...new Set([...document.querySelectorAll('#engineering img')].map(i=>i.src))];return Promise.all(sources.map(src=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve({src,width:i.naturalWidth});i.onerror=()=>resolve({src,width:0});i.src=src;})));});assert.ok(images.every(i=>i.width>0));
 await page.locator('#lang').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#engineering-origin h2').textContent(),'Form begins in the hand.');
 const untranslated=await page.locator('#engineering [data-en]').evaluateAll(nodes=>nodes.filter(n=>n.textContent!==n.dataset.en).length);assert.equal(untranslated,0);
 await capture(page,'desktop-english');check('English body copy, controls and image metadata; all archive images decode',{images:images.length});
 // Desktop layout at a second size; then phone and landscape layouts.
 for(const [name,width,height] of [['desktop-1440',1440,900],['laptop-1366',1366,768],['mobile-390',390,844],['mobile-320',320,568],['mobile-landscape',844,390]]){
  await page.setViewportSize({width,height});await page.goto(origin+'/cases/erste002/index.html#engineering/overview');await aligned(page,'overview');
  const bounds=await page.evaluate(()=>{const s=document.querySelector('#scroller');return{viewport:innerWidth,document:document.documentElement.scrollWidth,content:s.scrollWidth,root:s.clientWidth,band:document.querySelector('.route-band').getBoundingClientRect().toJSON(),footer:document.querySelector('.archive-footer').getBoundingClientRect().toJSON()}});
  assert.ok(bounds.document<=width&&bounds.content<=bounds.root+1,`${name} overflow ${JSON.stringify(bounds)}`);
  await page.locator('[data-engineering-next]').click();await aligned(page,'open');await page.locator('[data-photo="P4235"]').click();assert.equal(await page.locator('.archive-dialog').isVisible(),true);await page.locator('[data-photo-close]').click();
  await page.locator('.route-related').click();await shot(page,5);await page.locator('.route-related').click();await aligned(page,'open');
  await capture(page,name);check(name+' layout, chapter navigation, photo dialog and cross-route controls',bounds);
  await page.goto(origin+'/cases/erste002/index.html#product/01');await settled(page);
  const overlap=await page.evaluate(()=>{const a=document.querySelector('#caption').getBoundingClientRect(),b=document.querySelector('.route-entrance').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top});assert.equal(overlap,false,name+' opening caption must not overlap entrances');
  if(width<900)await capture(page,name+'-opening');
 }
 await context.close();
 // Normal motion: auto-play keeps its original linear product behavior.
 const motion=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}),mp=await motion.newPage();mp.on('pageerror',e=>report.errors.push(e.message));
 await open(mp);await settled(mp);
 async function traceOpeningAdvance(selector){
  await mp.evaluate(()=>{
   window.__openingAdvance=null;
   addEventListener('click',()=>{const start=performance.now(),samples=[];let moved=false;
    const sample=()=>{const playing=document.body.dataset.playing==='true';samples.push({ms:performance.now()-start,p:Number(document.body.dataset.progress),playing});moved ||= playing;
     if((moved&&!playing)||performance.now()-start>8000)window.__openingAdvance={moved,samples};else requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   },{once:true,capture:true});
  });
  await mp.locator(selector).click();await mp.waitForFunction(()=>window.__openingAdvance!==null);
  const trace=await mp.evaluate(()=>window.__openingAdvance),first=trace.samples[0].p,last=trace.samples.at(-1).p;
  assert.equal(trace.moved,true,selector+' must play the story transition');
  assert.ok(trace.samples.some(s=>s.p>first&&s.p<last),selector+' must include intermediate camera progress');
  return {from:first,to:last,durationMs:trace.samples.at(-1).ms,frames:trace.samples.length};
 }
 const nextTrace=await traceOpeningAdvance('#next-chapter');
 await mp.locator('#prev-chapter').click();await settled(mp);
 const entranceTrace=await traceOpeningAdvance('[data-explore-product]');
 assert.equal(entranceTrace.from,nextTrace.from);assert.equal(entranceTrace.to,nextTrace.to);
 assert.ok(Math.abs(entranceTrace.durationMs-nextTrace.durationMs)<350,'Both controls use the same transition duration');
 check('Explore Product and Next Shot play the same opening-to-shot-02 transition',{nextTrace,entranceTrace});
 await mp.locator('#prev-chapter').click();await settled(mp);
 await mp.locator('#auto').click();await mp.waitForFunction(()=>document.querySelector('#chapter-number').textContent.startsWith('02'),null,{timeout:18000});
 await mp.locator('.route-related').click();await route(mp,'engineering');assert.equal(await mp.locator('#auto').getAttribute('aria-pressed'),'false');
 check('Normal-motion auto-play advances linearly and pauses on engineering entry');await motion.close();
 // Degraded index and unavailable WebGL are checked independently.
 const degraded=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),dp=await degraded.newPage();
 await dp.route('**/engineering-assets.json',r=>r.fulfill({status:503,body:'Unavailable'}));await dp.goto(origin+'/cases/erste002/index.html#engineering/overview');await dp.locator('[data-retry-archive]').waitFor();await dp.unroute('**/engineering-assets.json');await dp.locator('[data-retry-archive]').click();await dp.locator('#topic-overview').waitFor();check('Image-index failure shows retry and recovers without reloading');await degraded.close();
 // Real host integration, including the unchanged floating navigation and language protocol.
 const hc=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce',serviceWorkers:'block'}),hp=await hc.newPage();hp.on('pageerror',e=>report.errors.push(e.message));
 await hp.goto(origin);await hp.waitForFunction(()=>window.rhine?.stats().startup==='started');await hp.locator('#skip').click();await hp.locator('.showcase-open').waitFor();await hp.locator('.showcase-open').click();await hp.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
 const frame=hp.frames().find(f=>f.url().includes('/cases/erste002/'));assert.ok(frame);await frame.locator('#topic-overview').waitFor({state:'attached'});await frame.locator('.route-entrance').waitFor();
 const toolbar=await hp.locator('.site-navigation').boundingBox();await frame.locator('.route-entrance [data-engineering-topic="overview"]').click();await aligned(frame,'overview');
 await frame.locator('.route-related').click();await shot(frame,1);await hp.evaluate(()=>history.back());await aligned(frame,'overview');await hp.evaluate(()=>history.forward());await shot(frame,1);await frame.locator('.route-related').click();await aligned(frame,'overview');check('Browser Back / Forward also works inside the terminal iframe');
 const sr=await frame.locator('#scroller').boundingBox();assert.ok(sr.y>=toolbar.y+toolbar.height);await capture(hp,'hosted-desktop');
 await hp.locator('.site-nav-language [data-terminal-language="en"]').click();assert.equal(await frame.locator('#engineering-origin h2').textContent(),'Form begins in the hand.');
 await frame.locator('[data-photo="P4241"]').first().click();await hp.keyboard.press('Escape');assert.equal(await frame.locator('.archive-dialog').isVisible(),false);assert.equal(await hp.locator('.project-case').isVisible(),true);
 await hp.locator('.project-case-close').click();await hp.waitForFunction(()=>!document.querySelector('.project-case').open);check('Host toolbar inset, language sync, image Escape isolation and return to terminal');
 // Actual study of ERSTE001 in the browser; no source changes are made there.
 await hp.locator('.detail-project-step[data-detail-direction="1"]').click();await hp.locator('.showcase-open').click();await hp.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');const first=hp.frames().find(f=>f.url().includes('/cases/erste001/'));assert.ok(first);await first.locator('#s08').evaluate(el=>el.scrollIntoView());await hp.waitForTimeout(800);await capture(hp,'reference-erste001');check('ERSTE001 browser reference: numbered chapters, photo grid, annotations and technical reading rhythm');
 await hc.close();assert.deepEqual(report.errors,[]);report.status='passed';
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce',serviceWorkers:'block'}),tp=await touch.newPage();
 await tp.goto(origin);await tp.waitForFunction(()=>window.rhine?.stats().startup==='started');await tp.locator('#skip').click();await tp.locator('.showcase-open').waitFor();await tp.locator('.showcase-open').click();await tp.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
 const tf=tp.frames().find(f=>f.url().includes('/cases/erste002/'));await tf.locator('.route-entrance').waitFor();await capture(tp,'hosted-touch-opening');
 await tf.locator('.route-entrance [data-engineering-topic]').click();await aligned(tf,'overview');
 const toolbarTouch=await tp.locator('.site-navigation').boundingBox(),scrollerTouch=await tf.locator('#scroller').boundingBox();assert.ok(scrollerTouch.y>=toolbarTouch.y+toolbarTouch.height);await capture(tp,'hosted-touch-engineering');
 await tf.locator('[data-engineering-next]').click();await aligned(tf,'open');await tf.locator('[data-photo="P4235"]').click();await tf.locator('[data-photo-close]').click();await tf.locator('.route-related').click();await shot(tf,5);check('Touch-enabled mobile host: toolbar, entrance, chapters, photo dialog and related product');await touch.close();
 const unavailable=await browser.newContext({viewport:{width:1440,height:900}}),up=await unavailable.newPage();await up.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/.test(type))return null;return original.call(this,type,...args);};});
 await up.goto(origin+'/cases/erste002/index.html#engineering/packaging');await up.locator('#topic-packaging').waitFor({state:'attached'});await aligned(up,'packaging');await up.locator('[data-engineering-prev]').click();await aligned(up,'comparison');check('Engineering remains browsable when WebGL is unavailable');await unavailable.close();
 const storage=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),sp=await storage.newPage();await sp.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('storage blocked')};Storage.prototype.setItem=()=>{throw Error('storage blocked')};});
 await open(sp,'#engineering/packaging');await aligned(sp,'packaging');await sp.locator('.route-related').click();await shot(sp,6);await sp.locator('.route-related').click();await aligned(sp,'assembly');check('Route switching still works with browser storage disabled');await storage.close();
 const performanceContext=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}),pp=await performanceContext.newPage();const failures=[];pp.on('requestfailed',r=>failures.push(r.url()));
 const wallStart=Date.now();await open(pp,'#engineering/overview');await pp.locator('#topic-overview img').evaluate(img=>img.decode());
 report.performance={localReadyAndFirstImageMs:Date.now()-wallStart,...await pp.evaluate(()=>({domNodes:document.querySelectorAll('*').length,resourceCount:performance.getEntriesByType('resource').length,transferredBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0),navigationMs:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,archiveScrollWidth:document.querySelector('#scroller').scrollWidth,viewport:innerWidth}))};assert.deepEqual(failures,[]);check('Local resource load and first physical photograph performance recorded',report.performance);await performanceContext.close();
}catch(error){report.status='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{report.finished=new Date().toISOString();await writeFile(out+'/browser-report.json',JSON.stringify(report,null,2));await browser.close();}
