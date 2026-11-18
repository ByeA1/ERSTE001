import assert from 'node:assert/strict';import{createRequire}from'node:module';import{writeFile,mkdir}from'node:fs/promises';
const{chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201';
const browser=await chromium.launch({channel:'msedge',headless:true}),out='.audit/recommendation-icons-20261114';await mkdir(out,{recursive:true});const results=[];
try{for(const[name,width,height,tier]of[['desktop',1440,900,'low'],['phone',390,844,'medium'],['small',320,568,'standard']]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:width<700,isMobile:width<700,deviceScaleFactor:width<700?2:1,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(45000);
 // Deterministic simulated recommendation, only in this test's intercepted
 // local module. Real startup rendering and all application policy still run.
 await p.route('**/src/quality-recommendation.ts*',async route=>{const response=await route.fetch(),body=await response.text();const replaced=body.replace('export function recommendPreset(probe) {',`export function recommendPreset(probe) { return '${tier}';`);assert.notEqual(replaced,body);await route.fulfill({response,body:replaced})});
 const prefs=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('tony-design-settings')));
 const buffer=()=>p.evaluate(()=>JSON.parse(document.querySelector('#three-scene').dataset.renderQuality));
 const settings=async()=>{await p.locator('[data-action="settings"]').click();await p.locator('.quality-settings').scrollIntoViewIfNeeded()};
 const close=async()=>{await p.locator('[data-action="close-modal"]').click();await p.waitForFunction(()=>!document.querySelector('#modal-root').children.length)};
 try{
  console.log(name+' starting');
  await p.goto(origin);await p.waitForFunction(()=>window.rhine?.stats().ready&&window.rhine.stats().startup==='started');
  const boot=await p.evaluate(()=>window.rhine.stats());assert.equal(boot.performance.recommendedTier,tier);assert.equal(boot.performance.mode,tier);assert.ok(boot.performance.completedAt<=boot.openingStartedAt);assert.ok(boot.performance.triangles>0);
  await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForTimeout(1300);const detailBuffer=await buffer();
  await settings();assert.equal(await p.locator('[data-quality="scale"]').inputValue(),'100');assert.equal(await p.locator('[data-quality="pixelRatio"]').inputValue(),'1.5');assert.match(await p.locator('#quality-selection').textContent(),/详情临时/);assert.equal((await prefs()).qualityOrigin,'system');assert.equal(await p.locator('[data-quality-mode="auto"]').count(),0);await close();
  await p.locator('.back-button').click();await p.waitForFunction(()=>window.rhine.stats().mode==='archive');await p.waitForTimeout(1200);const seaBuffer=await buffer();assert.ok(detailBuffer.width>=seaBuffer.width);assert.ok(detailBuffer.height>=seaBuffer.height);
  await settings();assert.equal(await p.locator('[data-quality="scale"]').inputValue(),tier==='low'?'50':tier==='medium'?'85':'90');
  await p.locator('[data-quality-mode="low"]').click();assert.equal((await prefs()).qualityOrigin,'user');await close();
  const locked=await p.evaluate(()=>window.rhine.stats().performance);
  await p.mouse.move(width*.25,height*.5);await p.mouse.down();await p.mouse.move(width*.7,height*.45,{steps:25});await p.mouse.up();await p.waitForTimeout(1800);
  assert.deepEqual(await p.evaluate(()=>window.rhine.stats().performance),locked,'Browsing cannot change a user preset');
  await p.evaluate(()=>{window.rhine.select(0);window.rhine.detail()});await p.waitForFunction(()=>window.rhine.stats().mode==='detail');await p.locator('.showcase-open').waitFor();await settings();assert.equal(await p.locator('[data-quality="scale"]').inputValue(),'50');assert.equal(await p.locator('[data-quality="pixelRatio"]').inputValue(),'1');
  await p.locator('.quality-recommendation').click();assert.equal((await prefs()).qualityOrigin,'system');assert.equal(await p.locator('[data-quality="scale"]').inputValue(),'100');
  await p.locator('[data-quality-mode="low"]').click();await close();await p.reload();await p.waitForFunction(()=>window.rhine?.stats().ready&&window.rhine.stats().startup==='started');assert.equal((await prefs()).qualityOrigin,'user');assert.equal((await prefs()).performanceMode,'low');
  await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForTimeout(1300);
  const icons=await p.locator('.terminal-utilities > button').evaluateAll(nodes=>nodes.map(e=>({button:e.getBoundingClientRect().toJSON(),icon:e.querySelector('.utility-icon').getBoundingClientRect().toJSON(),svg:!!e.querySelector('svg')})));assert.equal(icons.length,3);assert.ok(icons.every(e=>e.svg&&Math.abs(e.icon.width-icons[0].icon.width)<.1));if(width<700)assert.ok(icons.every(e=>e.button.width>=43.5&&e.button.height>=43.5));
  await p.screenshot({path:`${out}/${name}-locked.png`});
  await p.locator('.terminal-utilities [data-terminal-language="en"]').click();
  if(width<700){const boxes=await p.evaluate(()=>({nav:document.querySelector('.terminal-utilities').getBoundingClientRect().toJSON(),replay:document.querySelector('.system-footer > [data-action="replay"]').getBoundingClientRect().toJSON()}));assert.ok(boxes.nav.right+3<=boxes.replay.left,'utility group and replay must not overlap');}
  await settings();assert.match(await p.locator('.quality-recommendation').textContent(),/Use recommendation/);assert.match(await p.locator('#quality-selection').textContent(),/Manual selection/);await p.screenshot({path:`${out}/${name}-locked-settings-en.png`});
  assert.deepEqual(errors,[]);results.push({name,simulatedRecommendation:tier,probe:boot.performance,startupBeforeOpening:true,detailBuffer,seaBuffer,systemOnlyBoost:true,manualLockedDuringBrowsing:true,manualNoBoost:true,reload:true,icons,bilingual:true,errors});console.log(name+' startup recommendation, system-only detail boost, manual lock, reload, icons and bilingual passed');
 }catch(e){results.push({name,error:e.stack,errors});console.error(name,e.message);await p.screenshot({path:`${out}/${name}-failure.png`})}finally{await c.close();await writeFile(`${out}/policy-runtime.json`,JSON.stringify(results,null,2))}
}}finally{await browser.close()}
assert.ok(results.every(r=>!r.error));
