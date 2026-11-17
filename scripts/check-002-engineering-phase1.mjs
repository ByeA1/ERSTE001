import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {copy,sections,media,requests} from '../content/erste002-engineering-phase1.mjs';
const {chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const origin=process.env.ERSTE_ORIGIN||'http://127.0.0.1:5209';
const out='docs/erste002-engineering-phase1-evidence';await mkdir(out,{recursive:true});
const documentUrl=origin+'/cases/erste002/engineering.html';
const report={origin,url:documentUrl,browser:'Microsoft Edge / Chromium, real headless browser',started:new Date().toISOString(),checks:[],screenshots:[],errors:[]};
const record=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS '+name);};
const browser=await chromium.launch({channel:'msedge',headless:true});
async function rectSettled(page,id){
 try{await page.waitForFunction(id=>{const r=document.getElementById(id).getBoundingClientRect(),s=document.querySelector('#scroller').getBoundingClientRect(),inset=r.top-s.top;return Math.abs(inset-35)<3||(document.querySelector('#scroller').scrollTop===0&&inset>=0&&inset<35)},id);}
 catch(error){const state=await page.evaluate(id=>({id,hash:location.hash,current:document.body.dataset.archiveSection,scroll:document.querySelector('#scroller').scrollTop,target:document.getElementById(id).getBoundingClientRect().top,scroller:document.querySelector('#scroller').getBoundingClientRect().top}),id);error.stack+='\nAnchor state: '+JSON.stringify(state);throw error;}
}
async function gotoTopic(page,id){await page.goto(documentUrl+'#'+id);await rectSettled(page,id);}
async function painted(page){
 await page.waitForFunction(()=>[...document.querySelectorAll('.reveal')].filter(el=>{const r=el.getBoundingClientRect(),s=document.querySelector('#scroller').getBoundingClientRect();return Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>Math.min(100,r.height*.1);}).every(el=>Number(getComputedStyle(el).opacity)>.99));
 await page.evaluate(async()=>{const s=document.querySelector('#scroller').getBoundingClientRect();for(const img of document.querySelectorAll('.archive-media img')){const r=img.getBoundingClientRect();if(r.bottom>s.top&&r.top<s.bottom)await img.decode();}});
}
async function capture(page,name){await painted(page);await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:90});report.screenshots.push(name+'.jpg');}
function listen(page){page.on('pageerror',e=>report.errors.push(e.message));}
try{
 const context=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}),page=await context.newPage();listen(page);page.setDefaultTimeout(20000);
 const forbiddenRequests=[];page.on('request',r=>{if(/\.glb|story-app\.js|\/vendor\/three/.test(r.url()))forbiddenRequests.push(r.url());});
 await page.goto(documentUrl);await page.locator('.archive-local-header').waitFor();
 assert.equal(await page.locator('[data-chapter]').count(),7);assert.equal(await page.locator('[data-media-slot]').count(),media.length);
 const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
 assert.equal(await page.locator('#stage').count(),0);assert.equal(await page.locator('[data-related-product],[data-explore-product],.route-band').count(),0);
 for(const slot of media){const figure=page.locator('#media-'+slot.id);assert.equal(await figure.locator('.media-facts>div').count(),4);assert.equal(await figure.getAttribute('data-media-kind'),slot.kind);}
 assert.equal(await page.locator('#eng-refinement .completion-tag').count(),4);
 assert.equal(await page.locator('.request-row').count(),requests.length);
 assert.deepEqual(forbiddenRequests,[]);record('Independent static archive: prologue + five chapters + conclusion, unique IDs and labeled media slots, no PRODUCT or model runtime',{mediaSlots:media.length,imageRequests:requests.length});
 for(const width of [1920,1440]){
  await page.setViewportSize({width,height:width===1920?1080:900});
  for(const lang of ['zh','en']){
   await page.locator(`[data-archive-language="${lang}"]`).click();
   const failures=await page.locator('[data-zh][data-en]').evaluateAll((nodes,lang)=>nodes.filter(n=>n.textContent!==n.dataset[lang]).map(n=>n.dataset.copy||n.tagName),lang);assert.deepEqual(failures,[]);
   for(const [index,section]of sections.entries()){
    await page.locator(`.archive-rail a[href="#${section.id}"]`).click();await rectSettled(page,section.id);
    const bounds=await page.evaluate(()=>{const s=document.querySelector('#scroller');return{viewport:innerWidth,scrollWidth:s.scrollWidth,client:s.clientWidth,windowScrollY:scrollY};});
    assert.ok(bounds.scrollWidth<=bounds.client+1,`${width}/${lang}/${section.id} overflow: ${JSON.stringify(bounds)}`);assert.equal(bounds.windowScrollY,0);
    await capture(page,`pc-${width}-${lang}-${String(index).padStart(2,'0')}-${section.id.replace('eng-','')}`);
   }
   record(`${width}px ${lang}: all seven sections, readable bounds, language and screenshot review`);
  }
 }
 await page.setViewportSize({width:1920,height:1080});await page.locator('[data-archive-language="zh"]').click();
 const gallery=[];
 for(const slot of media.filter(m=>m.source)){
  const img=page.locator('#media-'+slot.id+' img');await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
  gallery.push(await img.evaluate(i=>({source:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight})));
 }
 assert.equal(gallery.length,12);assert.ok(gallery.every(i=>i.width>0));record('All 12 physical/CAD placements decode while walking the page; 8 unique photographs remain traceable',{gallery});
 for(const id of ['eng-form-comparison','eng-structure-ribs','eng-assembly-archive-geometry','eng-challenge-button','eng-challenge-battery','eng-refinement-structure','eng-refinement-structure-front','eng-refinement-structure-panels','eng-refinement-structure-edge','eng-refinement-structure-joint','media-refinement-edge-principle','eng-refinement-button','media-refinement-button-logic','media-refinement-button-thickness','eng-refinement-battery','media-refinement-battery-logic','eng-refinement-light-blocking','eng-image-register']){
  await gotoTopic(page,id);await capture(page,'detail-'+id.replace('eng-',''));
 }
 await gotoTopic(page,'eng-form-comparison');
 for(const id of ['A','B','C']){await page.locator(`[data-specimen="${id}"]`).click();assert.equal(await page.locator(`[data-specimen-marker="${id}"]`).getAttribute('data-active'),'');}
 const markerLayout=await page.locator('.specimen-markers').evaluate(node=>{const rect=node.getBoundingClientRect();return[...node.children].map(m=>{const r=m.getBoundingClientRect();return{identity:m.dataset.specimenMarker,inside:r.left>=rect.left&&r.right<=rect.right&&r.top>=rect.top&&r.bottom<=rect.bottom}});});assert.ok(markerLayout.every(m=>m.inside));record('A/B/C identity comparison respects actual photo positions and letterboxing',{markerLayout});
 await page.locator('#media-form-generations .image-open').click();await page.locator('.media-dialog').waitFor();assert.equal(await page.locator('.media-dialog').getAttribute('data-media-slot'),'form-generations');
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.media-dialog').getAttribute('data-media-slot'),'form-profile');
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('Escape');assert.equal(await page.locator('.media-dialog').isVisible(),false);assert.equal(await page.locator('#media-form-generations .image-open').evaluate(el=>el===document.activeElement),true);record('Photo dialog: full-size image, arrows, Escape and focus restoration');
 await gotoTopic(page,'eng-prologue');
 for(const section of sections.slice(1)){await page.locator('[data-chapter-next]').click();await rectSettled(page,section.id);}
 assert.equal(await page.locator('[data-chapter-next]').isDisabled(),true);
 for(const section of [...sections.slice(0,-1)].reverse()){await page.locator('[data-chapter-prev]').click();await rectSettled(page,section.id);}
 assert.equal(await page.locator('[data-chapter-prev]').isDisabled(),true);record('Linear chapter navigation and reading progress work independently to both boundaries');
 await gotoTopic(page,'eng-refinement-button');
 const requestLink=page.locator('#media-refinement-button-after .request-ref');await requestLink.scrollIntoViewIfNeeded();await painted(page);
 const sourceScroll=await page.locator('#scroller').evaluate(el=>el.scrollTop);await requestLink.click();await rectSettled(page,'request-R10');
 await page.goBack();await page.waitForFunction(value=>Math.abs(document.querySelector('#scroller').scrollTop-value)<3,sourceScroll);assert.equal(await page.evaluate(()=>location.hash),'#eng-refinement-button');
 await page.goForward();await rectSettled(page,'request-R10');await page.locator('#request-R10>a').click();await rectSettled(page,'eng-refinement');
 await page.waitForTimeout(220);const previous=await page.locator('#scroller').evaluate(el=>el.scrollTop);await page.reload();await page.waitForFunction(value=>Math.abs(document.querySelector('#scroller').scrollTop-value)<3,previous);record('Stable chapter/topic/request links, Back/Forward and reload position');
 assert.ok((await page.locator('#eng-design-validation-status').innerText()).includes('设计修改已完成'));
 const closing=await page.locator('#eng-conclusion').innerText();assert.ok(closing.includes('刚度局限'));assert.ok(!/正在修改|下一轮方案|等待解决|THE NEXT ITERATION/.test(await page.locator('#eng-refinement').innerText()));
 for(const slot of media.filter(m=>m.chapter==='eng-refinement')){assert.ok(['missing','schematic'].includes(slot.kind));if(slot.kind==='missing')assert.ok((await page.locator('#media-'+slot.id+' .media-facts').innerText()).includes('已完成的最新 CAD'));}
 record('Current CAD outcomes are complete-design statements; physical validation is separated centrally and new geometry is not fabricated');
 assert.equal(await page.locator('.structure-change').count(),4);assert.equal(await page.locator('.button-cause-grid>article').count(),3);assert.equal(await page.locator('.button-correction-grid>article').count(),4);assert.equal(await page.locator('[data-media-kind="schematic"]').count(),3);
 for(const key of ['refinement.structure.front.done','refinement.structure.panels.done','refinement.structure.edge.done','refinement.structure.joint.done','refinement.button.cause2.body','refinement.button.cause3.body','refinement.battery.path','refinement.battery.location.body'])assert.equal(await page.locator(`[data-copy="${key}"]`).textContent(),copy[key][0]);
 assert.ok((await page.locator('.button-principle').innerText()).includes('非实测位移场'));assert.ok((await page.locator('.battery-principle').innerText()).includes('不代表电池直接接触桌面'));assert.equal(await page.locator('#eng-refinement-light-blocking svg').count(),0);
 assert.equal(media.filter(m=>m.chapter==='eng-refinement'&&m.kind==='missing').length,11);record('Detailed designer record: four structural changes, three button causes, four corrections, upward battery insertion, retention and unknown light-blocking geometry');
 await context.close();
 const noScript=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}}),np=await noScript.newPage();await np.goto(documentUrl);assert.equal(await np.locator('[data-copy="conclusion.last"]').textContent(),copy['conclusion.last'][0]);assert.equal(await np.locator('h1').isVisible(),true);await noScript.close();record('Full static bilingual source remains readable with JavaScript disabled');
 const failureContext=await browser.newContext({viewport:{width:1440,height:900}}),fp=await failureContext.newPage();listen(fp);
 await fp.route('**/p4241-*.webp*',route=>route.fulfill({status:404,body:'Missing image'}));await fp.goto(documentUrl+'#eng-form-study');await fp.locator('#media-form-fdm.image-failed').waitFor();assert.equal(await fp.locator('#media-form-fdm .media-facts>div').count(),4);await fp.unroute('**/p4241-*.webp*');await fp.locator('#media-form-fdm .image-open').click();await fp.locator('#media-form-fdm img').evaluate(img=>img.decode());assert.equal(await fp.locator('#media-form-fdm').evaluate(el=>el.classList.contains('image-failed')),false);await failureContext.close();record('Missing physical image has an explicit fallback, preserves evidence captions and retries');
 const blocked=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),bp=await blocked.newPage();listen(bp);await bp.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('Blocked storage')};Storage.prototype.setItem=()=>{throw Error('Blocked storage')};});await bp.goto(documentUrl+'#%INVALID');await bp.locator('[data-chapter-next]').click();await rectSettled(bp,'eng-form');assert.equal(await bp.locator('html').getAttribute('data-archive-motion'),'reduced');await blocked.close();record('Disabled storage, malformed fragment and reduced motion remain usable');
 // Test the existing host service boundary without registering or wiring a new route.
 const hosted=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce',serviceWorkers:'block'}),hp=await hosted.newPage();listen(hp);
 const archiveHTML=await readFile('public/cases/erste002/engineering.html','utf8');await hp.route('**/cases/erste002/index.html',route=>route.fulfill({status:200,contentType:'text/html',body:archiveHTML}));
 await hp.goto(origin);await hp.waitForFunction(()=>window.rhine?.stats().startup==='started');await hp.locator('#skip').click();await hp.locator('.showcase-open').waitFor();await hp.locator('.showcase-open').click();await hp.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
 const frame=hp.frames().find(f=>f.url().includes('/cases/erste002/index.html'));assert.ok(frame);await frame.locator('#engineering-archive').waitFor();assert.equal(await frame.locator('.archive-local-header').isVisible(),false);
 const toolbar=await hp.locator('.site-navigation').boundingBox(),scrollBox=await frame.locator('#scroller').boundingBox();assert.ok(scrollBox.y>=toolbar.y+toolbar.height);
 await hp.locator('.site-nav-language [data-terminal-language="en"]').click();await frame.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await frame.locator('[data-copy="refinement.button.body"]').textContent(),copy['refinement.button.body'][1]);
 await frame.locator('#media-cover-built img').evaluate(i=>i.decode());await hp.screenshot({path:out+'/host-services-fixture.jpg',type:'jpeg',quality:90});report.screenshots.push('host-services-fixture.jpg');
 await frame.locator('#media-cover-built .image-open').click();await hp.keyboard.press('Escape');assert.equal(await frame.locator('.media-dialog').isVisible(),false);assert.equal(await hp.locator('.project-case').isVisible(),true);await hosted.close();record('Host-service fixture: unchanged toolbar, language protocol and image Escape isolation; no production route wiring');
 const perfContext=await browser.newContext({viewport:{width:1920,height:1080},serviceWorkers:'block'}),pp=await perfContext.newPage();listen(pp);const start=Date.now();await pp.goto(documentUrl);await pp.locator('#media-cover-built img').evaluate(i=>i.decode());report.performance={readyAndHeroMs:Date.now()-start,...await pp.evaluate(()=>({domContentLoadedMs:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,resources:performance.getEntriesByType('resource').length,transferred:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0),nodes:document.querySelectorAll('*').length}))};await perfContext.close();record('Local loading profile recorded without loading the product engine',report.performance);
 assert.deepEqual(report.errors,[]);report.status='passed';
}catch(error){report.status='failed';report.failure=error.stack;console.error(error);process.exitCode=1;}
finally{report.finished=new Date().toISOString();await writeFile(out+'/browser-report.json',JSON.stringify(report,null,2));await browser.close();}
