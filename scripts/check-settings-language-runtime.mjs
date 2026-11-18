import assert from 'node:assert/strict';import{createRequire}from'node:module';import{mkdir,writeFile}from'node:fs/promises';
const{chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright'),out='.audit/settings-i18n-20261114';await mkdir(out,{recursive:true});const b=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{for(const[name,width,height]of[['desktop',1440,900],['phone',390,844],['small',320,568]]){
 const p=await b.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700,deviceScaleFactor:width<700?2:1,serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(30000);
 try{
  await p.goto(process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201');await p.waitForFunction(()=>window.rhine?.stats().ready);await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.locator('[data-action=settings]').click();
  await p.locator('.motion-advanced').evaluate(e=>e.open=true);await p.locator('[data-motion=idleWave]').uncheck();
  await p.locator('[data-quality-mode=custom]').click();await p.locator('[data-quality=scale]').evaluate(e=>{e.value='115';e.dispatchEvent(new Event('change',{bubbles:true}))});
  const saved=await p.evaluate(()=>localStorage.getItem('tony-design-settings'));
  await p.locator('.terminal-modal').evaluate(e=>e.scrollTop=550);const beforeScroll=await p.locator('.terminal-modal').evaluate(e=>e.scrollTop);
  await p.locator('.settings-modal [data-terminal-language=en]').click();
  const untranslated=await p.locator('.terminal-modal').evaluate(root=>{const r=[],w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode()){const node=w.currentNode;if(!node.parentElement.closest('[data-terminal-language]')&&/[\u3400-\u9fff]/.test(node.nodeValue))r.push(node.nodeValue.trim())}for(const el of root.querySelectorAll('[aria-label],[title],[placeholder]'))if(!el.closest('.terminal-language'))for(const attr of ['aria-label','title','placeholder'])if(/[\u3400-\u9fff]/.test(el.getAttribute(attr)||''))r.push(attr+':'+el.getAttribute(attr));return r});
  assert.deepEqual(untranslated,[]);assert.equal(await p.locator('.settings-modal [data-terminal-language=en]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#toast').textContent(),'Animation disabled');assert.equal(await p.locator('[data-quality=scale]').inputValue(),'115');assert.equal(await p.locator('[data-motion=idleWave]').isChecked(),false);
  assert.ok(await p.locator('.motion-advanced').evaluate(e=>e.open));assert.ok(await p.locator('.quality-advanced').evaluate(e=>e.open));
  assert.ok(Math.abs((await p.locator('.terminal-modal').evaluate(e=>e.scrollTop))-beforeScroll)<3,'Preserve scroll');
  assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('data-terminal-language')),'en');
  assert.equal(await p.evaluate(()=>localStorage.getItem('tony-design-settings')),saved);
  await p.locator('.terminal-modal').evaluate(e=>e.scrollTop=0);await p.screenshot({path:`${out}/${name}-en-top.png`});
  await p.locator('.quality-settings').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-en-quality.png`});
  await p.locator('.settings-modal [data-terminal-language=zh]').click();const text=await p.locator('.terminal-modal').innerText();
  assert.equal(await p.locator('.settings-modal [data-terminal-language=zh]').getAttribute('aria-pressed'),'true');
  assert.match(text,/系统设置/);assert.match(text,/动效控制/);assert.match(text,/开场演出/);assert.match(text,/数字滚动/);assert.match(await p.locator('.settings-shortcuts').textContent(),/键盘操作/);assert.doesNotMatch(text,/SYSTEM SETTINGS|SYSTEM PREFERENCES|SUPER PERFORMANCE|ANIMATION CONTROLS|BOOT SEQUENCE|VIEWER NAVIGATION|KEYBOARD CONTROLS/);
  await p.locator('[data-motion=idleWave]').check();assert.equal(await p.locator('#toast').textContent(),'已启用此动画');assert.match(await p.locator('#motion-preference-note').innerText(),/完整动画/);
  await p.locator('.terminal-modal').evaluate(e=>e.scrollTop=0);await p.screenshot({path:`${out}/${name}-zh-top.png`});
  assert.ok(await p.locator('.terminal-modal').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  const boxes=await p.locator('.modal-top-actions').evaluate(e=>{const nav=e.querySelector('nav').getBoundingClientRect(),close=e.querySelector('[data-action="close-modal"]').getBoundingClientRect();return{navRight:nav.right,closeLeft:close.left}});assert.ok(boxes.navRight<=boxes.closeLeft);
  assert.deepEqual(errors,[]);results.push({name,englishUntranslated:untranslated,zhHeaders:true,valuesPreserved:true,scrollPreserved:true,expandedPreserved:true,focusPreserved:true,noOverflow:true,errors});console.log(name+' in-modal language, complete copy, state and layout passed');
 }catch(e){results.push({name,error:e.stack,errors});console.error(name,e.message);await p.screenshot({path:`${out}/${name}-failure.png`}).catch(()=>{})}finally{await p.close();await writeFile(`${out}/results.json`,JSON.stringify(results,null,2))}
}}finally{await b.close()}
assert.ok(results.every(r=>!r.error));
