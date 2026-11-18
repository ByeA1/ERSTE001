import assert from 'node:assert/strict';
import {preview} from 'vite';
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=resolve('.audit/interaction-20261114');await mkdir(out,{recursive:true});
const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0}});
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const metadata=JSON.parse(await readFile('dist/pwa-build.json','utf8'));
const report={release:metadata.version,checks:[],errors:[]};
try{for(const channel of (process.env.REVIEW_CHANNELS||'chrome,msedge').split(',')){
 const browser=await chromium.launch({channel,headless:true});
 try{for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1,serviceWorkers:'block'});
  context.setDefaultTimeout(30000);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.rhine?.stats().ready);
   await page.locator('#skip').click();await page.waitForFunction(()=>window.rhine.stats().mode!=='boot');
   const initialPrefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('tony-design-settings')));
   await page.locator('[data-action="settings"]').click();await page.locator('[data-quality-mode="custom"]').click();
   await page.locator('[data-quality="antialias"]').selectOption('smaa');await page.locator('[data-quality="shadows"]').selectOption('4096');
   let state=await page.evaluate(()=>({prefs:JSON.parse(localStorage.getItem('tony-design-settings')),performance:window.rhine.stats().performance,quality:JSON.parse(document.querySelector('#three-scene').dataset.renderQuality)}));
   assert.equal(state.performance.mode,'custom');assert.equal(state.quality.antialias,'smaa');assert.equal(state.quality.shadows,4096);
   const {performanceMode:ignoredMode,rendering:ignoredQuality,qualityOrigin:ignoredOrigin,...unchanged}=state.prefs;
   const {performanceMode:ignoredInitial,rendering:ignoredInitialQuality,qualityOrigin:ignoredInitialOrigin,...original}=initialPrefs;
   assert.deepEqual(unchanged,original,'Quality controls must not change motion, audio, super-performance or other preferences');
   await page.locator('.quality-recommendation').click();
   assert.equal(await page.evaluate(()=>window.rhine.stats().performance.mode),await page.evaluate(()=>window.rhine.stats().performance.recommendedTier));
   await page.locator('[data-quality-mode="low"]').click();
   assert.equal(await page.evaluate(()=>window.rhine.stats().performance.mode),'low','An explicit preset disables auto');
   await page.keyboard.press('Escape');
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.rhine?.stats().ready);
   assert.equal(await page.evaluate(()=>window.rhine.stats().performance.mode),'low','Manual preference persists');
   await page.locator('#skip').click();
   await page.evaluate(()=>window.DesignTerminal.openProject('erste001'));
   await page.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
   const frame=page.frames().find(f=>f.url().includes('/cases/erste001/index.html'));assert.ok(frame);
   const scroll=()=>frame.locator('#scroller').evaluate(el=>el.scrollTop);
   assert.equal(await scroll(),0);
   if(mobile){
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:170,y:580}]});
    for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:170,y:580-i*22}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{await page.mouse.move(650,470);await page.mouse.wheel(0,650)}
   await frame.waitForFunction(()=>document.querySelector('#scroller').scrollTop>100);
   const firstScroll=await scroll();
   await frame.locator('.side-nav .nav-item').nth(2).click();
   await frame.waitForFunction(()=>document.querySelector('.side-nav .nav-item:nth-child(3)').getAttribute('aria-current')==='location');
   await page.waitForTimeout(1500);const atChapter=await scroll();
   await page.mouse.move(mobile?180:650,mobile?440:470);await page.mouse.wheel(0,350);
   await frame.waitForFunction(at=>document.querySelector('#scroller').scrollTop>at+50,atChapter);
   await page.waitForTimeout(200);const beforeClose=await scroll();
   await page.screenshot({path:resolve(out,`001-${channel}-${mobile?'mobile':'desktop'}.png`)});
   assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open);
   await page.evaluate(()=>window.DesignTerminal.openProject('erste001'));
   await page.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
   assert.ok(Math.abs((await scroll())-beforeClose)<2,'Re-entry preserves the reading position');
   await page.mouse.move(mobile?180:650,mobile?440:470);await page.mouse.wheel(0,350);
   await frame.waitForFunction(at=>document.querySelector('#scroller').scrollTop>at+50,beforeClose);
   await page.locator('.project-case [data-terminal-language="en"]').click();await frame.waitForFunction(()=>document.documentElement.lang==='en');
   await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open);
   await page.evaluate(()=>window.DesignTerminal.openProject('erste002'));
   await page.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open',null,{timeout:60000});
   const second=page.frames().find(f=>f.url().includes('/cases/erste002/index.html'));
   assert.equal(await second.evaluate(()=>document.documentElement.dataset.terminalPerformanceMode),'low');
   assert.equal(await second.locator('#scene-root').getAttribute('data-adaptive-tier'),'low');
   await second.waitForFunction(()=>document.body.dataset.playing==='false');
   await second.locator('#next-chapter').click();await second.waitForFunction(()=>document.body.dataset.playing==='false');
   assert.deepEqual(errors,[]);
   report.checks.push({channel,browser:browser.version(),mobile,manualSaved:true,qualityOnly:true,firstScroll,chapterJump:true,reentry:true,touch:mobile,manualInherited:true,errors});
   console.log(channel,mobile?'mobile':'desktop','quality controls, first scroll, chapters, re-entry and 002 passed');
  }catch(e){report.errors.push({channel,mobile,error:e.stack,console:errors});console.error(channel,mobile,e.message);await page.screenshot({path:resolve(out,`failure-${channel}-${mobile}.png`)}).catch(()=>{})}
  finally{await context.close();await writeFile(resolve(out,'quality-scroll-runtime.json'),JSON.stringify(report,null,2))}
 }}finally{await browser.close()}
}}finally{server.httpServer.closeAllConnections();await new Promise(r=>server.httpServer.close(r))}
assert.deepEqual(report.errors,[]);
