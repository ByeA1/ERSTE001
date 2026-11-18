import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {preview} from 'vite';
import {qualityPresets} from '../src/render-quality.ts';import {adaptiveRenderQuality,automaticTiers} from '../src/adaptive-quality.ts';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'../.audit/model-logo/tools/node_modules/playwright');
const out='.audit/quality-cover-20261114';await mkdir(out,{recursive:true});
const server=await preview({configFile:false,preview:{host:'127.0.0.1',port:0}}),origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true}),report={environment:{browser:browser.version(),mobile:'Chromium touch emulation, not Safari'},checks:[],errors:[]};
try{for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,568]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<700,isMobile:width<700,deviceScaleFactor:width<700?2:1,serviceWorkers:'block'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.setDefaultTimeout(45000);
 const prefs=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('tony-design-settings')));
 const ready=async()=>{await p.waitForFunction(()=>window.rhine?.stats().ready);await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForFunction(()=>Number(document.querySelector('#detail-content').style.opacity)>.98)};
 const openSettings=async()=>{await p.locator('[data-action="settings"]').click();await p.locator('.quality-settings').scrollIntoViewIfNeeded()};
 try{
  await p.goto(origin);await ready();await openSettings();
  assert.equal(await p.locator('.quality-tiers button').count(),5);
  assert.match(await p.locator('.quality-recommendation').textContent(),/系统推荐/);
  const boot=await p.evaluate(()=>window.rhine.stats());assert.ok(boot.performance.completedAt<=boot.openingStartedAt);assert.equal(boot.performance.locked,true);assert.ok(boot.performance.triangles>0);
  const samples=[];
  for(const tier of automaticTiers){
   await p.locator(`.quality-tiers [data-quality-mode="${tier}"]`).click();
   assert.equal(await p.locator(`.quality-tiers [data-quality-mode="${tier}"]`).getAttribute('aria-pressed'),'true');
   const actual=await p.locator('[data-quality]').evaluateAll(controls=>Object.fromEntries(controls.map(c=>[c.dataset.quality,c.dataset.quality==='antialias'?c.value:Number(c.value)])));
   const buffer=await p.evaluate(()=>JSON.parse(document.querySelector('#three-scene').dataset.renderQuality));
   assert.equal(buffer.transmission,actual.transmission);assert.equal(buffer.antialias,actual.antialias);
   for(const [key,value] of Object.entries(adaptiveRenderQuality(qualityPresets.original,tier)))assert.equal(actual[key],value,`${name} ${tier} ${key}`);
   assert.equal((await prefs()).performanceMode,tier);samples.push({tier,actual,buffer});
  }
  await p.locator('[data-quality-mode="custom"]').click();
  await p.locator('[data-quality="scale"]').evaluate(e=>{e.value='145';e.dispatchEvent(new Event('change',{bubbles:true}))});
  await p.locator('[data-quality="pixelRatio"]').selectOption('2');
  const custom=(await prefs()).rendering;assert.equal(custom.scale,145);assert.equal(custom.pixelRatio,2);
  await p.locator('.quality-recommendation').click();assert.deepEqual((await prefs()).rendering,custom);
  assert.match(await p.locator('#quality-selection').textContent(),/系统预设|当前/);
  await p.locator('[data-quality-mode="low"]').click();await p.locator('[data-quality-mode="custom"]').click();
  assert.equal(await p.locator('[data-quality="scale"]').inputValue(),'145');
  await p.screenshot({path:`${out}/${name}-quality-zh.png`});
  assert.ok(await p.locator('.quality-tiers').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await p.locator('[data-action="close-modal"]').click();await p.waitForFunction(()=>!document.querySelector('#modal-root')?.children.length);await p.locator('.terminal-utilities [data-terminal-language="en"]').click();await openSettings();
  assert.match(await p.locator('#quality-selection').textContent(),/saved and locked/);
  assert.equal(await p.locator('[data-quality-mode="standard"] strong').textContent(),'Detailed');
  await p.locator('.quality-advanced').evaluate(e=>e.open=false);await p.locator('.quality-settings').scrollIntoViewIfNeeded();
  await p.screenshot({path:`${out}/${name}-quality-en.png`});
  await p.reload();await ready();await openSettings();assert.equal((await prefs()).performanceMode,'custom');assert.deepEqual((await prefs()).rendering,custom);
  await p.locator('[data-quality-mode="high"]').click();await p.locator('[data-action="close-modal"]').click();await p.waitForFunction(()=>!document.querySelector('#modal-root')?.children.length);
  const icons=await p.locator('.terminal-utilities > button .utility-icon').evaluateAll(nodes=>nodes.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,svg:!!e.querySelector('svg')})));
  assert.equal(icons.length,3);assert.ok(icons.every(v=>v.svg&&Math.abs(v.w-icons[0].w)<.1&&Math.abs(v.h-icons[0].h)<.1));
  await p.screenshot({path:`${out}/${name}-utilities-new.png`});
  const covers=[];
  for(const id of ['erste002','erste001']){
   if(id==='erste001'){await p.locator('.detail-project-step[data-detail-direction="1"]').click();await p.waitForTimeout(1400)}
   assert.equal(await p.locator('.showcase-open').getAttribute('data-project'),id);
   await p.screenshot({path:`${out}/${name}-${id}-detail.png`});
   await p.locator('.viewer-open').click();await p.waitForFunction(()=>document.querySelector('.model-viewer')?.dataset.projectPrint==='true');
   await p.waitForTimeout(1700);
   const start=await p.locator('.model-viewer').evaluate(e=>JSON.parse(e.dataset.stats));
   assert.equal(start.parts.length,6);assert.ok(start.parts.every(g=>g.z===0));
   await p.screenshot({path:`${out}/${name}-${id}-assembled.png`});
   await p.locator('[data-viewer="explode"]').click();await p.waitForFunction(()=>JSON.parse(document.querySelector('.model-viewer').dataset.stats).spread===1);
   await p.screenshot({path:`${out}/${name}-${id}-exploded.png`});
   await p.locator('[data-viewer="frosted"]').click();await p.waitForTimeout(500);await p.locator('[data-viewer="clear"]').click();
   await p.locator('[data-viewer="assemble"]').click();await p.waitForFunction(()=>JSON.parse(document.querySelector('.model-viewer').dataset.stats).spread===0);
   const end=await p.locator('.model-viewer').evaluate(e=>JSON.parse(e.dataset.stats));assert.deepEqual(end.parts,start.parts);
   await p.locator('[data-viewer="close"]').click();await p.waitForTimeout(500);covers.push({id,print:true,assemblyRestored:true});
  }
  // Verify the new intermediate tier and custom lock reach the existing 002 engine.
  await openSettings();await p.locator('[data-quality-mode="standard"]').click();await p.locator('[data-action="close-modal"]').click();await p.waitForFunction(()=>!document.querySelector('#modal-root')?.children.length);
  await p.evaluate(()=>window.DesignTerminal.openProject('erste002'));
  await p.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
  const f=p.frames().find(f=>f.url().includes('/cases/erste002/index.html'));assert.ok(f);
  await f.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.playing==='false');
  assert.equal(await f.locator('#scene-root').getAttribute('data-adaptive-tier'),'standard');
  assert.equal(await f.evaluate(()=>document.documentElement.dataset.terminalPerformanceMode),'standard');
  await f.locator('#next-chapter').click();await f.waitForFunction(()=>document.body.dataset.playing==='false');
  assert.ok(await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);report.checks.push({name,width,height,samples,customSaved:true,startupRecommendation:true,bilingual:true,covers,caseTierInherited:true,errors});console.log(name+' passed');
 }catch(e){report.errors.push({name,error:e.stack,console:errors});await p.screenshot({path:`${out}/${name}-failure.png`});console.error(name,e.message)}finally{await context.close();await writeFile(`${out}/runtime-results.json`,JSON.stringify(report,null,2))}
}}finally{await browser.close();server.httpServer.closeAllConnections();await new Promise(r=>server.httpServer.close(r))}
assert.deepEqual(report.errors,[]);
