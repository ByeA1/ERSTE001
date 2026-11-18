import assert from 'node:assert/strict';import{createRequire}from'node:module';import{writeFile,mkdir}from'node:fs/promises';
const{chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');const out=process.env.REVIEW_OUT||'.audit/mobile-layout-20261115';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{for(const[name,width,height,touch]of[['small',320,568,true],['phone',390,740,true],['large-phone',430,900,true],['wide-touch',804,1748,true],['landscape',640,360,true],['desktop',1440,900,false]].filter(item=>!process.env.REVIEW_LAYOUT||process.env.REVIEW_LAYOUT.split(',').includes(item[0]))){
 const c=await browser.newContext({viewport:{width,height},isMobile:touch,hasTouch:touch,deviceScaleFactor:touch?2:1,serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(process.env.REVIEW_ORIGIN||'http://127.0.0.1:5201');await p.waitForFunction(()=>window.rhine?.stats().startup==='started');await p.locator('#skip').click();await p.locator('.showcase-open').waitFor();await p.waitForTimeout(1500);
  for(const id of ['erste002','erste001']){
   if(id==='erste001'){await p.locator('.detail-project-step[data-detail-direction="1"]').click();await p.waitForTimeout(650)}
   const mobileActions=touch||width<=640;
   const checkOrder=async mobile=>{
    assert.equal(await p.locator(mobile?'.object-caption > .showcase-open':'.detail-actions > .showcase-open').getAttribute('data-project'),id);
    assert.equal(await p.locator(mobile?'.detail-actions > .viewer-open':'.object-caption > .viewer-open').count(),1);
    assert.equal(await p.locator('.showcase-open').count(),1);assert.equal(await p.locator('.viewer-open').count(),1);
   };
   await checkOrder(mobileActions);
   // Reflow must move the existing controls, not rebuild them or duplicate listeners.
   if(id==='erste002'&&(name==='desktop'||name==='phone')){
    const entry=await p.locator('.showcase-open').elementHandle(),inspect=await p.locator('.viewer-open').elementHandle();
    for(const[w,h,mobile]of(name==='desktop'?[[1000,760,false],[804,1000,false],[390,740,true]]:[[1440,900,false]])){
     await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);await checkOrder(mobile);
     assert.ok(await entry.evaluate(e=>e===document.querySelector('.showcase-open')));assert.ok(await inspect.evaluate(e=>e===document.querySelector('.viewer-open')));
    }
    await p.setViewportSize({width,height});await p.waitForTimeout(250);await checkOrder(mobileActions);
    await entry.dispose();await inspect.dispose();
   }
   if(!mobileActions){
    const glass=await p.locator('.showcase-open').evaluate(e=>{const c=getComputedStyle(e);return{fill:c.backgroundColor,blur:c.backdropFilter};});
    assert.match(glass.fill,/rgba\(/);const alpha=Number(glass.fill.match(/[\d.]+(?=\)$)/)[0]);assert.ok(alpha>.5&&alpha<.7);assert.equal(glass.blur,'blur(10px) saturate(1.15)');
    // Verify composited translucency, not only a CSS declaration: a backdrop
    // change must remain visible through an empty area of the actual button.
    await p.mouse.move(2,2);await p.locator('.showcase-open').scrollIntoViewIfNeeded();
    const patches=[];const entry=p.locator('.showcase-open');
    const original=await entry.evaluate(e=>e.parentElement.style.backgroundColor);
    for(const color of ['#000','#fff']){
     await entry.evaluate((e,color)=>e.parentElement.style.backgroundColor=color,color);await p.waitForTimeout(80);
     patches.push((await entry.screenshot()).toString('base64'));
    }
    await entry.evaluate((e,color)=>e.parentElement.style.backgroundColor=color,original);
    const transmission=await p.evaluate(async patches=>{
     const values=[];for(const base64 of patches){const img=new Image();img.src='data:image/png;base64,'+base64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const data=x.getImageData(Math.round(img.width*.18),Math.round(img.height*.2),Math.max(1,Math.round(img.width*.12)),Math.max(1,Math.round(img.height*.12))).data;let sum=0;for(let i=0;i<data.length;i+=4)sum+=(data[i]+data[i+1]+data[i+2])/3;values.push(sum/(data.length/4));}return values[1]-values[0];
    },patches);assert.ok(transmission>45,'The desktop command must visibly transmit the backdrop');report.push({name,id,glass,transmission});
   }
   await p.locator('.viewer-open').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-${id}-detail.png`});await p.locator('.viewer-open').click();await p.waitForFunction(()=>document.querySelector('.model-viewer')?.dataset.projectPrint==='true');await p.locator('[data-viewer="close"]').click();await p.waitForTimeout(500);
   await p.locator('.showcase-open').click();await p.waitForFunction(()=>document.querySelector('.project-case')?.dataset.casePhase==='open');
   const f=p.frames().find(f=>f.url().includes(`/cases/${id}/`));assert.ok(f);
   const bar=await p.locator('.site-navigation').evaluate(e=>({box:e.getBoundingClientRect().toJSON(),menu:e.querySelector('.site-nav-menu').hidden,active:e.contains(document.activeElement),exit:e.querySelector('.project-case-close').getBoundingClientRect().toJSON()}));assert.ok(bar.box.right<=width&&bar.box.left>=0);assert.ok(bar.exit.top>=bar.box.top&&bar.exit.bottom<=bar.box.bottom);
   if(touch){assert.ok(bar.box.height<=58,'Mobile toolbar must fit one row');assert.equal(await p.locator('.site-nav-project').textContent(),id.toUpperCase());assert.equal(await p.locator('.site-nav-profile').isVisible(),false);}
   if(id==='erste001'){
    await f.waitForFunction(()=>document.querySelector('#s01 img').complete);await p.waitForTimeout(1900);
    const hero=await f.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON(),img=document.querySelector('#s01 img'),a=rect('#s01 img');return{section:rect('#s01'),stage:rect('#s01 .hero-wallhack-stage'),label:rect('#s01 .hero-info-panel'),title:rect('#s01 h1'),traits:rect('#s01 .hero-traits'),nav:rect('.side-nav'),scroll:rect('#scroller'),font:getComputedStyle(document.querySelector('#s01 h1')).fontFamily,source:img.currentSrc,subject:{left:a.x+a.width*689/1920,right:a.x+a.width*1325/1920,top:a.y+a.height*237/1080,bottom:a.y+a.height*674/1080}}});
    if(touch && width<height){assert.ok(Math.abs((hero.subject.left+hero.subject.right)/2-width/2)<3);assert.ok(hero.subject.left>=12&&hero.subject.right<=width-12);assert.ok(hero.subject.top>=hero.nav.bottom+8);assert.ok(hero.subject.bottom+12<hero.label.top);assert.ok(hero.traits.bottom<=height-8);assert.ok(hero.title.right<=width-12);assert.ok(Math.abs(hero.label.left-24)<1);}
    await p.screenshot({path:`${out}/${name}-zh.png`});
    // Chapter navigation must still use the unobstructed reading area.
    await f.locator('.side-nav a[href="#s02"]').click();await p.waitForTimeout(1700);const chapter=await f.locator('#s02 .section-inner').boundingBox();assert.ok(chapter.y>=bar.box.bottom-1);await f.locator('.side-nav a[href="#s01"]').click();await p.waitForTimeout(1600);
    await p.locator('.site-nav-toggle').click();await p.waitForTimeout(400);assert.equal(await p.locator('.site-nav-menu').isVisible(),true);assert.equal(await p.locator('.site-nav-profile').isVisible(),true);await p.screenshot({path:`${out}/${name}-menu.png`});
    await p.locator('.site-nav-language [data-terminal-language="en"]').click();await p.waitForTimeout(200);await p.locator('.site-nav-toggle').click();await p.waitForTimeout(400);assert.equal(await p.locator('.project-case-close .action-label').textContent(),'Back to terminal');assert.equal(await f.locator('#s01 .hero-category').textContent(),'FPS GAMING MOUSE');const enFont=await f.locator('#s01 h1').evaluate(e=>getComputedStyle(e).fontFamily);assert.equal(enFont,hero.font);const image=await p.screenshot({path:`${out}/${name}-en.png`});
    const paint=await p.evaluate(async({base64,region})=>{
      const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
      const scale=image.width/innerWidth;const x=Math.max(0,Math.round(region.left*scale)),y=Math.max(0,Math.round(region.top*scale)),w=Math.min(image.width-x,Math.round((region.right-region.left)*scale)),h=Math.min(image.height-y,Math.round((region.bottom-region.top)*scale));
      const pixels=ctx.getImageData(x,y,w,h).data;let dark=0;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])<120)dark++;
      return{dark,ratio:dark/(w*h)};
    },{base64:image.toString('base64'),region:hero.subject});assert.ok(paint.ratio>.15,'The hero must actually be painted after chapter return and language switching');

    report.push({name,id,hero,toolbar:bar,bilingual:true,chapterJump:true,paint});
   }
   await p.locator('.project-case-close').click();await p.waitForFunction(()=>!document.querySelector('.project-case').open);await checkOrder(mobileActions);
  }
  assert.deepEqual(errors,[]);console.log(name+' cover, toolbar, responsive detail actions, inspection, language and chapter navigation passed');
 }catch(e){report.push({name,error:e.stack,errors});console.error(name,e.message);await p.screenshot({path:`out/${name}-mobile-layout-failure.png`}).catch(()=>{})}finally{await c.close();await writeFile(`${out}/runtime.json`,JSON.stringify(report,null,2))}
}}finally{await browser.close()}
assert.ok(report.every(r=>!r.error),'See runtime.json');
