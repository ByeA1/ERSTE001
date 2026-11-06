import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(path.resolve('.audit/model-logo/tools/package.json'));
const { chromium } = require('playwright');
if(process.argv.includes('--production')){await import('./check-production-cache.mjs');process.exit();}
if(process.argv.includes('--review-ui')){await import('./check-review-ui.mjs');process.exit();}
if(process.argv.includes('--portable')){await import('./check-portable-review.mjs');process.exit();}
const out=path.resolve('.audit/model-logo/browser'); await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),scope:'Installed desktop browsers, headless, actual GPU reported below; NOT Radeon 780M acceptance',runs:[],checks:[]};
const base='http://127.0.0.1:4178';
for(const [browserName,executablePath] of [['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]) {
 const browser=await chromium.launch({executablePath,headless:true});
 try {
  for(const profile of ['native','office']) for(const variant of profile==='native'?['original','draco-18','draco-16','meshopt-16','quantize-16']:['original','draco-18']) {
   const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
   const page=await context.newPage(),errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.goto(`${base}/?cassetteReview=${variant}&reviewNetwork=${profile}`);
   await page.waitForFunction(()=>window.__cassetteReview?.metrics.archiveReadyMs && window.rhine?.stats().ready,{},{timeout:120000});
   const result=await page.evaluate(async()=>({cold:window.__cassetteReview.metrics,warm:await window.__cassetteReview.warm(5),stats:window.rhine.stats()}));
   report.runs.push({browser:browserName,version:browser.version(),profile,variant,...result,errors});
   console.log(JSON.stringify({browser:browserName,profile,variant,fetch:result.cold.fetchMs,decode:result.cold.parseDecodeMs,init:result.cold.sceneInitializeMs,shader:result.cold.shaderCompileMs,renderer:result.cold.renderer,errors}));
   if(profile==='native') {
    await page.evaluate(()=>window.rhine.archive());
    await page.waitForTimeout(800);
    // Freeze just the review scene at reproducible times; application's production
    // renderer and input remain untouched outside this isolated test build.
    await page.evaluate(()=>{const s=window.__cassetteReview.scene,update=s.update.bind(s);s.update=()=>{};s.setMode('archive');for(let i=0;i<180;i++)update(100+i/60);});
    await page.screenshot({path:path.join(out,`${browserName}-${variant}-archive.png`)});
    await page.evaluate(()=>{const s=window.__cassetteReview.scene;s.setMode('detail');const update=Object.getPrototypeOf(s).update.bind(s);for(let i=0;i<240;i++)update(104+i/60);});
    await page.screenshot({path:path.join(out,`${browserName}-${variant}-detail.png`)});
   }
   assert.equal(errors.length,0,JSON.stringify(errors)); await context.close();
   await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(`${base}/reviews/model-logo/`);
  await page.waitForFunction(()=>document.querySelectorAll('#logos svg').length===3);
  const logos=await page.locator('#logos svg').evaluateAll(nodes=>nodes.map(svg=>({mode:svg.dataset.logoMode,animations:svg.getAnimations({subtree:true}).map(a=>a.playState)})));
  assert.deepEqual(logos.map(x=>x.animations.length),[3,1,0]);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.ok((await page.locator('#logos svg').evaluateAll(nodes=>nodes.every(svg=>svg.getAnimations({subtree:true}).length===0))));
  await page.emulateMedia({reducedMotion:'no-preference'}); await page.screenshot({path:path.join(out,`${browserName}-logos.png`)});
  report.checks.push({browser:browserName,logoFullLightStill:logos,reducedMotion:true});await page.close();
 }finally{await browser.close();await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2));}
}
console.log('Browser comparison complete');
