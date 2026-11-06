import fs from 'node:fs/promises';import path from 'node:path';import{createRequire}from'node:module';import assert from'node:assert/strict';
const require=createRequire(path.resolve('.audit/model-logo/tools/package.json'));const{chromium}=require('playwright');
const out=path.resolve('.audit/model-logo/browser'),report={date:new Date().toISOString(),checks:[],errors:[]};await fs.mkdir(out,{recursive:true});
const save=()=>fs.writeFile(path.join(out,'interactions.json'),JSON.stringify(report,null,2));
if(process.argv.includes('--diagnose')){
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.goto('http://127.0.0.1:4178/?cassetteReview=draco-18');await p.waitForFunction(()=>window.rhine?.stats().ready);await p.evaluate(()=>window.rhine.archive());await p.waitForTimeout(2500);
 const state=()=>p.evaluate(()=>{const s=window.__cassetteReview.scene,c=document.querySelector('canvas'),r=c.getBoundingClientRect();return{canBrowse:s.canBrowse(),reveal:s.reveal,looping:s.looping,detail:s.detail,presence:s.presenceTarget,canvas:r.toJSON(),hit:document.elementFromPoint(r.x+r.width*.25,r.y+r.height*.55)?.outerHTML.slice(0,600),stats:window.rhine.stats()};});console.log(JSON.stringify(await state()));
 const r=await p.locator('#three-scene canvas').boundingBox();await p.mouse.move(r.x+r.width*.25,r.y+r.height*.55);await p.mouse.down();await p.mouse.move(r.x+r.width*.36,r.y+r.height*.58,{steps:8});console.log(JSON.stringify(await state()));await p.mouse.up();await b.close();process.exit();
}
for(const[browserName,executablePath]of[['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]){
 const browser=await chromium.launch({executablePath,headless:true});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});const page=await context.newPage();
   const key=`${browserName}-${mobile?'mobile-simulation':'desktop'}`,errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   try{
    await page.goto('http://127.0.0.1:4178/?cassetteReview=draco-18');
    await page.waitForFunction(()=>window.rhine?.stats().ready,{},{timeout:60000});
    await page.waitForFunction(()=>document.querySelector('#stage').dataset.openingPhase==='welcome',{},{timeout:20000});
    const logo=await page.locator('.welcome-logo svg').evaluate(svg=>({mode:svg.dataset.logoMode,animations:svg.getAnimations({subtree:true}).map(a=>a.playState),bounds:svg.getBoundingClientRect().toJSON()}));
    assert.equal(logo.mode,'full');assert.deepEqual(logo.animations,['running','running','running']);
    await page.locator('.welcome-logo').screenshot({path:path.join(out,`${key}-welcome-logo.png`)});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.welcome-logo svg').dataset.logoMode==='still');
    assert.equal(await page.locator('.welcome-logo svg').evaluate(svg=>svg.getAnimations({subtree:true}).length),0);await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>document.querySelector('#stage').dataset.openingPhase==='archive',{},{timeout:20000});
    const naturalArrayMs=await page.evaluate(()=>performance.now());
    await page.evaluate(()=>window.rhine.archive());await page.waitForFunction(()=>window.__cassetteReview.scene.canBrowse(),{},{timeout:15000});
    assert.ok(await page.locator('.welcome-logo svg').evaluate(svg=>svg.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
    // Test the same document visibility callback deterministically. This is an
    // injected visibility event, explicitly separate from real hardware / tab QA.
    const visibility=await page.evaluate(()=>{const svg=document.querySelector('.welcome-logo svg');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));const paused=svg.getAnimations({subtree:true}).every(a=>a.playState==='paused');delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return{injectedEvent:true,paused};});assert.ok(visibility.paused);
    const canvas=page.locator('#three-scene canvas');const box=await canvas.boundingBox();assert.ok(box&&box.width>0);
    await page.mouse.move(box.x+box.width*.25,box.y+box.height*.55);await page.mouse.down();await page.mouse.move(box.x+box.width*.36,box.y+box.height*.58,{steps:8});const drag=await page.evaluate(()=>window.rhine.stats());await page.mouse.up();assert.ok(drag.holdingArchive||drag.dragTrack,'archive drag handler active');
    await page.locator('[data-terminal-language="en"]').first().click();assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.locator('[data-terminal-language="zh"]').first().click();
    await page.evaluate(()=>{window.rhine.select(0);window.rhine.archive();window.rhine.detail();});
    await page.waitForFunction(()=>window.rhine.stats().canInspect,{},{timeout:20000});const rotationBefore=await page.evaluate(()=>window.rhine.stats().rotation);
    await page.mouse.move(box.x+box.width*.25,box.y+box.height*.48);await page.mouse.down();await page.mouse.move(box.x+box.width*.40,box.y+box.height*.48,{steps:12});await page.mouse.up();await page.waitForTimeout(300);const rotationAfter=await page.evaluate(()=>window.rhine.stats().rotation);assert.ok(Math.abs(rotationAfter-rotationBefore)>.05,'cassette rotation responds');
    await page.locator('.project-directory [data-showcase-project="erste002"]').click();await page.waitForFunction(()=>window.rhine.stats().selected.includes('002'));
    await page.locator('.showcase-open[data-project="erste002"]').click();
    await page.waitForFunction(()=>document.querySelector('iframe[data-project-id="erste002"]')?.dataset.loaded==='true',{},{timeout:60000});
    const caseFrame=page.frames().find(f=>f.url().includes('/cases/erste002/'));assert.ok(caseFrame);await caseFrame.waitForFunction(()=>document.body.dataset.ready==='true',{},{timeout:60000});
    await page.waitForFunction(()=>!document.querySelector('iframe[data-project-id="erste002"]').inert,{},{timeout:30000});
    await caseFrame.locator('#mode').click();await caseFrame.waitForFunction(()=>document.body.dataset.mode==='free');await caseFrame.locator('#part').selectOption('shell_top');await caseFrame.locator('#explode').click();await caseFrame.waitForTimeout(400);await caseFrame.locator('#reset').click();await caseFrame.locator('#mode').click();
    await caseFrame.locator('#scroller').evaluate(el=>el.scrollTop=(el.scrollHeight-el.clientHeight)*.55);await caseFrame.waitForTimeout(600);const caseState=await caseFrame.evaluate(()=>({ready:document.body.dataset.ready,mode:document.body.dataset.mode,progress:document.body.dataset.progress,cut:document.body.dataset.cut,emissive:document.body.dataset.emissive}));assert.ok(Number(caseState.progress)>.4);
    await page.screenshot({path:path.join(out,`${key}-002.png`)});
    await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open,{},{timeout:15000});
    await page.locator('.showcase-open[data-project="erste002"]').click();await page.waitForFunction(()=>document.querySelector('.project-case').open);assert.equal(page.frames().filter(f=>f.url().includes('/cases/erste002/')).length,1);await page.locator('.project-case-close').click();await page.waitForFunction(()=>!document.querySelector('.project-case').open,{},{timeout:15000});
    const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert.ok(overflow.scroll<=overflow.client+1);
    assert.equal(errors.length,0,JSON.stringify(errors));report.checks.push({key,logo,naturalArrayMs,visibility,dragActive:true,rotationBefore,rotationAfter,languageSwitch:true,caseState,reenterWithoutDuplicateIframe:true,overflow,consoleErrors:errors});
   }catch(e){const diagnostics=await page.evaluate(()=>{const s=window.__cassetteReview?.scene,c=document.querySelector('#three-scene canvas'),r=c?.getBoundingClientRect();return{stats:window.rhine?.stats(),canBrowse:s?.canBrowse(),presence:s?.presenceTarget,reveal:s?.reveal,detail:s?.detail,looping:s?.looping,inert:s?.container?.closest('[inert]')?.id,pointElement:r?document.elementFromPoint(r.x+r.width*.3,r.y+r.height*.55)?.outerHTML.slice(0,600):null};}).catch(()=>null);report.errors.push({key,error:String(e),consoleErrors:errors,diagnostics});console.log(key,String(e),JSON.stringify(diagnostics));await page.screenshot({path:path.join(out,`${key}-failure.png`)}).catch(()=>{});}
   await context.close();await save();
  }
 }finally{await browser.close();}
}
// Observe the actual opening in the controlled network profile without skipping.
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const variant of ['original','draco-18']){const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(`http://127.0.0.1:4178/?cassetteReview=${variant}&reviewNetwork=office`);await page.waitForFunction(()=>window.rhine?.stats().opening.phase==='archive',{},{timeout:60000});const timing=await page.evaluate(()=>({navigationToArrayPhaseMs:performance.now(),metrics:window.__cassetteReview.metrics,trace:JSON.parse(document.querySelector('#stage').dataset.openingTrace)}));report.checks.push({key:'Chrome-office-natural-opening',variant,...timing});await page.close();await save();}}finally{await browser.close();}
await save();assert.equal(report.errors.length,0,JSON.stringify(report.errors));console.log('Interaction / opening / layout checks complete');
