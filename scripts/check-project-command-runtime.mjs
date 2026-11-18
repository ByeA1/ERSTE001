import {createRequire} from 'node:module';import assert from 'node:assert/strict';import fs from 'node:fs';const {chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
try{for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<700,hasTouch:width<700,serviceWorkers:'block'}),p=await context.newPage();p.setDefaultTimeout(60000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201');await p.waitForFunction(()=>window.rhine?.stats().ready&&window.rhine.stats().startup==='started');await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForTimeout(2000);
 for(const id of ['erste002','erste001']){
  if(id==='erste001'){await p.locator('.detail-project-step[data-detail-direction="1"]').click();await p.waitForTimeout(700)}
  await p.locator('.showcase-open').click();await p.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
  const nav=p.locator('.site-navigation'),close=p.locator('.site-navigation .project-case-close');await close.waitFor();
  const style=await close.evaluate(e=>{const c=getComputedStyle(e),l=e.querySelector('.action-label'),r=l.getBoundingClientRect(),t=document.createRange();t.selectNodeContents(l);const b=t.getBoundingClientRect();return{background:c.backgroundColor,blur:c.backdropFilter,corners:c.backgroundImage,delta:Math.abs(r.left+r.right-b.left-b.right)/2,rect:e.getBoundingClientRect().toJSON(),label:r.toJSON()}});
  assert.ok(style.delta<1);if(width<640){assert.equal(style.blur,'none');assert.equal(style.background,'rgba(0, 0, 0, 0)');}else{assert.equal(style.blur,'blur(6px) saturate(1.05)');assert.match(style.corners,/linear-gradient/);}assert.ok(style.rect.right<=width&&style.rect.left>=0);
  const frame=p.frames().find(f=>f.url().includes(`/cases/${id}/`));assert.ok(frame);
  if(id==='erste002'){
   await frame.waitForFunction(()=>document.body.dataset.projectReady==='ready'&&!document.querySelector('#next-chapter').disabled);await p.waitForTimeout(250);
   const state=await frame.locator('#next-chapter').evaluate(e=>{const c=getComputedStyle(e),l=e.querySelector('.action-label'),r=l.getBoundingClientRect(),t=document.createRange();t.selectNodeContents(l);const b=t.getBoundingClientRect();return{background:c.backgroundColor,corners:c.backgroundImage,sweep:getComputedStyle(e,'::before').content,delta:Math.abs(r.left+r.right-b.left-b.right)/2}});assert.equal(state.sweep,'none');assert.match(state.corners,/linear-gradient/);assert.ok(state.delta<1);report.push({name,id,next:state});
  }
  await p.screenshot({path:`.audit/commands-switch-20261115/${name}-${id}-project.png`});
  if(!await p.locator('.site-nav-language [data-terminal-language="en"]').isVisible())await p.locator('.site-nav-toggle').click();
  await p.locator('.site-nav-language [data-terminal-language="en"]').click();assert.equal(await close.locator('.action-label').textContent(),'Back to terminal');await nav.screenshot({path:`.audit/commands-switch-20261115/${name}-${id}-toolbar-en.png`});
  await close.click();await p.waitForFunction(()=>!document.querySelector('.project-case').open);assert.equal(await p.locator('.showcase-open').getAttribute('data-project'),id);report.push({name,id,style,errors});
 }
 await p.locator('.detail-project-step[data-detail-direction="1"]').click();await p.waitForTimeout(80);await p.locator('.back-button').click();await p.waitForFunction(()=>document.querySelector('#three-scene').dataset.coverPhase==='closed');await p.locator('.read-file').click();await p.waitForFunction(()=>document.querySelector('#three-scene').dataset.coverPhase==='open');assert.deepEqual(errors,[]);await context.close();console.log(name+' themed primary commands, project return, interrupted blend passed');
}}finally{await browser.close();fs.writeFileSync('.audit/commands-switch-20261115/project-commands.json',JSON.stringify(report,null,2))}
