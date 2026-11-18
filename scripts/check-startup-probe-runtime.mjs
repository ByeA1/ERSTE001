import assert from 'node:assert/strict';import{createRequire}from'node:module';import{mkdir,writeFile}from'node:fs/promises';
const{chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const out='.audit/quality-probe-20261115';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try{for(const[name,width,height,dpr,kind]of[['slow-laptop',2169,1111,1.5,'slow'],['manual-full',1440,900,1,'manual'],['no-gpu-timer',390,844,3,'fallback'],['invalid-gpu-timer',1440,900,1,'invalid'],['timer-failure',1440,900,1,'timer-error']].filter(item=>!process.env.REVIEW_CASE||item[4]===process.env.REVIEW_CASE)){
 const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:width<700,hasTouch:width<700,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(60000);
 await p.addInitScript(({kind})=>{
  // Controlled GPU timing fixtures, not a hardware-emulation/4060 result.
  if(kind==='manual'&&!localStorage.getItem('tony-design-settings'))localStorage.setItem('tony-design-settings',JSON.stringify({qualityModeVersion:3,qualityOrigin:'user',performanceMode:'high'}));
  const proto=WebGL2RenderingContext.prototype,getExt=proto.getExtension,getQuery=proto.getQueryParameter,getParam=proto.getParameter,begin=proto.beginQuery,costs=new WeakMap();
  proto.getExtension=function(name){if(kind==='fallback'&&name==='EXT_disjoint_timer_query_webgl2')return null;return getExt.call(this,name)};
  proto.beginQuery=function(target,query){
   const q=JSON.parse(document.querySelector('#three-scene')?.dataset.renderQuality||'{}');
   const gpu=q.transmission===1?30:q.transmission===.75?23:q.transmission===.5?16:5;
   if(query)costs.set(query,gpu*1e6);return begin.call(this,target,query);
  };
  proto.getQueryParameter=function(query,pname){if(kind==='timer-error')throw new Error('Simulated unsupported timing result');if((kind==='slow'||kind==='manual')&&pname===this.QUERY_RESULT&&costs.has(query))return costs.get(query);return getQuery.call(this,query,pname)};
  proto.getParameter=function(pname){if(kind==='invalid'&&pname===0x8fbb)return true;return getParam.call(this,pname)};
 },{kind});
 try{
  await p.goto(process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201');await p.waitForFunction(()=>window.rhine?.stats().startup==='started');const boot=await p.evaluate(()=>window.rhine.stats());
  assert.ok(boot.performance.completedAt<=boot.openingStartedAt);assert.equal(boot.returningFiles,0,'Probe returns must be disposed');assert.equal(boot.selected,'X-002','Restore the original featured record');assert.equal(await p.locator('#three-scene canvas').evaluate(e=>e.style.visibility),'');
  if(kind==='slow'||kind==='manual'){
   assert.equal(boot.performance.recommendedTier,'low');assert.equal(boot.performance.mode,kind==='manual'?'high':'low');
   for(const run of Object.values(boot.performance.tiers)){assert.equal(run.frameMs.length,6);assert.ok(run.drawCalls>=200);assert.ok(run.triangles>=3000000);assert.equal(run.method,'timer-query');}
   if(kind==='slow'){assert.equal(boot.performance.tiers.high.width,3253);assert.ok(boot.performance.tiers.high.height>=1666);}
  }
  if(kind==='timer-error'){assert.equal(boot.performance.recommendedTier,'medium');assert.equal(boot.performance.tiers,undefined);assert.match(boot.performance.source,/unavailable/);}
  if(kind==='fallback'){assert.ok(Object.values(boot.performance.tiers).every(run=>run.method==='gpu-completion'&&run.gpuMs.length===0));}
  if(kind==='invalid'){assert.equal(boot.performance.recommendedTier,'low');assert.ok(Object.values(boot.performance.tiers).every(run=>run.frameMs.length===0));}
  await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForTimeout(1700);await p.locator('[data-action="settings"]').click();await p.locator('.quality-settings').scrollIntoViewIfNeeded();
  assert.equal(await p.locator(`[data-quality-mode="${boot.performance.mode}"]`).getAttribute('aria-pressed'),'true');
  assert.match(await p.locator('#quality-selection').textContent(),kind==='manual'?/手动选择/:/系统预设|当前/);
  await p.screenshot({path:`${out}/${name}-zh.png`});await p.locator('.settings-modal [data-terminal-language="en"]').click();assert.match(await p.locator('.quality-recommendation').textContent(),/recommendation/i);await p.screenshot({path:`${out}/${name}-en.png`});
  await p.locator('[data-action="close-modal"]').click();await p.waitForFunction(()=>!document.querySelector('#modal-root').children.length);
  const locked=await p.evaluate(()=>window.rhine.stats().performance);await p.locator('.back-button').click();await p.waitForTimeout(1500);await p.mouse.move(width*.25,height*.5);await p.mouse.down();await p.mouse.move(width*.65,height*.6,{steps:20});await p.mouse.up();await p.waitForTimeout(800);assert.deepEqual(await p.evaluate(()=>window.rhine.stats().performance),locked,'The startup recommendation must not become runtime adaptation');
  await p.locator('[data-action="settings"]').click();await p.locator('.quality-settings').scrollIntoViewIfNeeded();await p.locator('[data-quality-mode="medium"]').click();
  await p.reload();await p.waitForFunction(()=>window.rhine?.stats().startup==='started');const reload=await p.evaluate(()=>window.rhine.stats());assert.equal(reload.performance.mode,'medium');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('tony-design-settings')).qualityOrigin),'user');
  assert.deepEqual(errors,[]);results.push({name,width,height,dpr,fixture:kind,boot:boot.performance,reload:reload.performance.mode,unmodifiedOpening:true,noProbeReturns:true,noRuntimeAdaptation:true,errors});console.log(name+' passed');
 }catch(e){results.push({name,error:e.stack,errors});console.error(name,e.message);await p.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{})}finally{await c.close();await writeFile(`${out}/runtime.json`,JSON.stringify(results,null,2))}
}}finally{await browser.close()}
assert.ok(results.every(r=>!r.error),'See runtime.json');

