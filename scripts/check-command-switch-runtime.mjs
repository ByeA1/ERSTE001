import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const out='.audit/commands-switch-20261115';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{for(const [name,width,height,recommendation,manual] of [['desktop',1440,900,'high',true],['phone',390,844,'low',false],['small',320,568,'medium',false]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<700,isMobile:width<700,deviceScaleFactor:width<700?2:1,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/quality-recommendation.ts*',async route=>{const response=await route.fetch(),body=await response.text();await route.fulfill({response,body:body.replace('export function recommendPreset(probe) {',`export function recommendPreset(probe) { return '${recommendation}';`)})});
 if(manual)await page.addInitScript(()=>localStorage.setItem('tony-design-settings',JSON.stringify({qualityModeVersion:3,qualityOrigin:'user',performanceMode:'medium'})));
 try{
  await page.goto(process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201');await page.waitForFunction(()=>window.rhine?.stats().ready&&window.rhine.stats().startup==='started');
  await page.locator('#skip').click();await page.locator('.showcase-open').waitFor();await page.waitForTimeout(3000);
  const initial=await page.evaluate(()=>window.rhine.stats());
  // Collect browser frame cadence, scene state, actual canvas size and text visibility.
  await page.evaluate(()=>{window.switchFrames=[];const start=performance.now();let last=start;function sample(t){const s=document.querySelector('#three-scene'),c=s.querySelector('canvas');window.switchFrames.push({t:t-start,dt:t-last,mode:document.querySelector('#stage').dataset.mode,phase:s.dataset.coverPhase,id:s.dataset.coverProject,reveal:Number(s.dataset.coverReveal),buffer:[c.width,c.height],opacity:Number(document.querySelector('#detail-content').style.opacity),model:window.rhine.stats().cameraDetail});last=t;if(t-start<1800)requestAnimationFrame(sample)}requestAnimationFrame(sample)});
  await page.locator('.detail-project-step[data-detail-direction="1"]').click();await page.waitForTimeout(1900);
  const frames=await page.evaluate(()=>window.switchFrames);const busy=frames.filter(f=>f.phase==='crossfading');assert.ok(busy.length>0,'Cover must crossfade');assert.ok(frames.every(f=>f.mode==='detail'&&f.reveal===1&&f.opacity>.99),'No archive/reveal detour or disappearing copy');assert.ok(frames.every(f=>String(f.buffer)===String(frames[0].buffer)),'No quality buffer resizes');assert.equal(frames.at(-1).id,'erste001');assert.equal(frames.at(-1).phase,'open');assert.ok(frames.every(f=>f.model>=initial.cameraDetail-.01),'Detail camera must not restart');
  const settled=frames.find(f=>f.id==='erste001'&&f.phase==='open');assert.ok(settled.t<700,'Cover settles in less than .7s');
  await page.screenshot({path:`${out}/${name}-detail.png`});
  // Rapid reversals and final requested project are stable.
  await page.locator('.detail-project-step[data-detail-direction="1"]').click();await page.waitForTimeout(75);await page.locator('.detail-project-step[data-detail-direction="-1"]').click();await page.waitForTimeout(600);assert.equal(await page.locator('#three-scene').getAttribute('data-cover-project'),'erste001');
  // Same-position project directory uses the identical in-place route.
  const dir=page.locator('.archive-directory [data-directory-id="erste002"]');
  if(await dir.count()){await dir.click();await page.waitForTimeout(600);assert.equal(await page.locator('#three-scene').getAttribute('data-cover-project'),'erste002');}
  // Text and icon have independent slots, with text centered in its own slot.
  const labels=await page.locator('.showcase-open .action-label,.back-button .action-label').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const t=range.getBoundingClientRect();return {slot:r.toJSON(),text:t.toJSON(),delta:Math.abs((r.left+r.right)-(t.left+t.right))/2}}));assert.ok(labels.every(l=>l.delta<1));
  await page.locator('[data-action="settings"]').click();await page.locator('.quality-settings').scrollIntoViewIfNeeded();
  const mode=manual?'medium':recommendation;assert.equal(await page.locator(`[data-quality-mode="${mode}"]`).getAttribute('aria-pressed'),'true');
  const marked=await page.locator('[data-quality-mode][data-recommended="true"]').count();assert.equal(marked,manual?0:1);
  const caption=await page.locator('#quality-selection').textContent();assert.match(caption,manual?/手动选择/:/系统预设|当前/);
  await page.screenshot({path:`${out}/${name}-settings.png`});
  await page.locator('.settings-modal [data-terminal-language="en"]').click();assert.match(await page.locator('#quality-selection').textContent(),manual?/Manual selection/:/System preset|Current/);assert.match(await page.locator('.quality-recommendation').textContent(),manual?/Use recommendation/:/System recommendation/);
  await page.locator('.terminal-modal').evaluate(e=>e.scrollTop=0);await page.locator('[data-action="close-modal"]').click();await page.waitForFunction(()=>!document.querySelector('#modal-root').children.length);
  if(width<700){
   const footer=await page.evaluate(()=>{const nav=document.querySelector('.terminal-utilities'),nodes=[...nav.querySelectorAll(':scope >button,.terminal-language button'),document.querySelector('.system-footer >[data-action="replay"]')];return {nav:{background:getComputedStyle(nav).backgroundColor,blur:getComputedStyle(nav).backdropFilter,border:getComputedStyle(nav).borderWidth},buttons:nodes.map(e=>({rect:e.getBoundingClientRect().toJSON(),background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow})),navBox:nav.getBoundingClientRect().toJSON(),replay:nodes.at(-1).getBoundingClientRect().toJSON()}});
   assert.equal(footer.nav.background,'rgba(0, 0, 0, 0)');assert.equal(footer.nav.blur,'none');assert.equal(footer.nav.border,'0px');assert.ok(footer.buttons.every(b=>b.rect.height>=43.5&&b.rect.height<45&&Math.abs(b.rect.top-footer.buttons[0].rect.top)<1&&b.background==='rgba(0, 0, 0, 0)'&&b.shadow==='none'));assert.ok(footer.navBox.right+2<=footer.replay.left);results.push({name,footer});
  }
  await page.screenshot({path:`${out}/${name}-en.png`});
  await page.locator('.back-button').click();await page.waitForFunction(()=>window.rhine.stats().mode==='archive');await page.waitForTimeout(1600);await page.screenshot({path:`${out}/${name}-sea.png`});assert.equal(await page.locator('#three-scene').getAttribute('data-cover-phase'),'closed');
  await page.locator('.read-file').click();await page.waitForFunction(()=>document.querySelector('#three-scene').dataset.coverPhase==='open');
  const intervals=frames.map(f=>f.dt).sort((a,b)=>a-b);const metric={name,manual,recommendation,initial:initial.performance,settledMs:settled.t,frameMaxMs:Math.max(...intervals),frameP95Ms:intervals[Math.floor(intervals.length*.95)],labels,errors,frames};assert.deepEqual(errors,[]);results.push(metric);console.log(name+' switch, rapid reversal, quality labels, footer and copy alignment passed');
 }catch(e){results.push({name,error:e.stack,errors});console.error(name,e.message);await page.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{})}finally{await context.close();await writeFile(`${out}/runtime.json`,JSON.stringify(results,null,2))}
}}finally{await browser.close()}
assert.ok(results.every(r=>!r.error),'See runtime.json');
