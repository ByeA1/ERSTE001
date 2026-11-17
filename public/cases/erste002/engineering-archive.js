const root=document.documentElement;
const scroller=document.querySelector('#scroller');
const chapters=[...document.querySelectorAll('[data-chapter]')];
const chapterLinks=[...document.querySelectorAll('[data-section-link]')];
const photos=[...document.querySelectorAll('[data-open-media]')];
const dialog=document.querySelector('.media-dialog');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const storageKey='erste002:engineering-phase1';
const documentKey='erste002-engineering-phase1';
const fragmentId=()=>{try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}};
let language='zh',current=0,photoIndex=0,opener,frame=0,scrollTimer=0,lockTarget='',paused=false,parentReduced=false;
const reduce=()=>motion.matches||parentReduced;
const label=node=>language==='en'?node.dataset.en:node.dataset.zh;
const historyState=()=>({...history.state,archiveRead:{document:documentKey,target:location.hash.slice(1),scroll:scroller.scrollTop}});
function store(){
  history.replaceState(historyState(),'',location.href);
  try{sessionStorage.setItem(storageKey,JSON.stringify({target:location.hash.slice(1),scroll:scroller.scrollTop}));}catch{}
}
function update(){
 frame=0;if(paused)return;
 const top=scroller.getBoundingClientRect().top,threshold=top+Math.min(200,scroller.clientHeight*.25);
 current=Math.max(0,chapters.findLastIndex(chapter=>chapter.getBoundingClientRect().top<=threshold));
 chapterLinks.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
 const item=chapterLinks[current];
 document.querySelector('.current-section b').textContent=item.firstElementChild.textContent;
 document.querySelector('.current-section>span').textContent=label(item.querySelector('[data-zh]'));
 document.querySelector('[data-chapter-prev]').disabled=current===0;
 document.querySelector('[data-chapter-next]').disabled=current===chapters.length-1;
 const last=chapters.at(-1),end=last.offsetTop+last.offsetHeight-scroller.clientHeight;
 const progress=Math.min(1,Math.max(0,scroller.scrollTop/Math.max(1,end)));
 document.querySelector('.reading-track>span').style.width=progress*100+'%';
 document.querySelector('.reading-progress output').textContent=String(Math.round(progress*100)).padStart(3,'0')+'%';
 document.body.dataset.archiveSection=chapters[current].id;
}
function schedule(){if(!frame&&!paused)frame=requestAnimationFrame(update);}
function endScroll(){lockTarget='';store();}
function layoutTop(node){let top=0;for(let item=node;item&&item!==scroller;item=item.offsetParent)top+=item.offsetTop;return top;}
scroller.addEventListener('scroll',()=>{schedule();clearTimeout(scrollTimer);scrollTimer=setTimeout(endScroll,180);},{passive:true});
function go(id,{push=true,scroll,focus=true}={}){
 const target=document.getElementById(id);if(!target||!scroller.contains(target))return;
 clearTimeout(scrollTimer);
 if(push){store();history.pushState({...history.state,archiveRead:{document:documentKey,target:id}},'',`#${id}`);}
 lockTarget=id;
 // Reveal transforms must never change an anchor's final scroll destination.
 const top=Number.isFinite(scroll)?scroll:layoutTop(target)-35;
 scroller.scrollTo({top:Math.max(0,top),behavior:!push||reduce()?'instant':'smooth'});
 if(focus){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
 scrollTimer=setTimeout(endScroll,200);schedule();
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[href^="#"]');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 let id;try{id=decodeURIComponent(link.getAttribute('href').slice(1));}catch{return;}if(!document.getElementById(id))return;
 event.preventDefault();go(id);
});
document.querySelector('[data-chapter-prev]').onclick=()=>{if(current>0)go(chapters[current-1].id);};
document.querySelector('[data-chapter-next]').onclick=()=>{if(current<chapters.length-1)go(chapters[current+1].id);};
addEventListener('popstate',event=>{
 clearTimeout(scrollTimer);const record=event.state?.archiveRead,id=fragmentId()||chapters[0].id;
 go(id,{push:false,scroll:record?.document===documentKey?record.scroll:undefined});
});
addEventListener('hashchange',()=>{
 const id=fragmentId();if(!id||!document.getElementById(id))return;
 // Native fragment scrolling runs after popstate. Apply our inset afterwards.
 requestAnimationFrame(()=>{const record=history.state?.archiveRead;go(id,{push:false,scroll:record?.document===documentKey&&record.target===id?record.scroll:undefined});});
});
function describePhoto(){
 const source=photos[photoIndex],figure=source.closest('figure'),image=dialog.querySelector('img');
 image.src=source.dataset.full;image.alt=source.querySelector('img').alt;
 const fields=[...figure.querySelectorAll('.media-facts>div')].slice(0,3).map(node=>node.querySelector('dd').textContent);
 dialog.querySelector('figcaption').textContent=fields.join(' / ');
 dialog.querySelector('footer output').textContent=`${String(photoIndex+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
 dialog.dataset.mediaSlot=figure.dataset.mediaSlot;
}
function closePhoto(){dialog.close();dialog.querySelector('img').removeAttribute('src');opener?.focus({preventScroll:true});}
photos.forEach((button,index)=>button.addEventListener('click',()=>{
 const figure=button.closest('figure');
 if(figure.classList.contains('image-failed')){figure.classList.remove('image-failed');const image=button.querySelector('img');image.removeAttribute('srcset');image.src=button.dataset.full+'?retry='+Date.now();return;}
 photoIndex=index;opener=button;describePhoto();dialog.showModal();
}));
document.querySelector('[data-media-close]').onclick=closePhoto;
for(const button of document.querySelectorAll('[data-media-step]'))button.onclick=()=>{photoIndex=(photoIndex+Number(button.dataset.mediaStep)+photos.length)%photos.length;describePhoto();};
dialog.addEventListener('cancel',event=>{event.preventDefault();closePhoto();});
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closePhoto();});
document.addEventListener('keydown',event=>{
 if(!dialog.open)return;if(!['Escape','ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(event.key==='Escape')closePhoto();else{photoIndex=(photoIndex+(event.key==='ArrowLeft'?-1:1)+photos.length)%photos.length;describePhoto();}
},true);
const markers=document.querySelector('.specimen-markers');
document.querySelector('#media-form-generations .image-open').append(markers);markers.dataset.ready='true';
const comparisonImage=document.querySelector('#media-form-generations img');
for(const marker of markers.children){marker.dataset.u=parseFloat(marker.style.getPropertyValue('--x'));marker.dataset.v=parseFloat(marker.style.getPropertyValue('--y'));}
function placeSpecimens(){
 const box=comparisonImage.getBoundingClientRect(),ratio=(comparisonImage.naturalWidth||1536)/(comparisonImage.naturalHeight||1152);
 const width=Math.min(box.width,box.height*ratio),height=width/ratio,x=(box.width-width)/2,y=(box.height-height)/2;
 for(const marker of markers.children){marker.style.setProperty('--x',x+width*Number(marker.dataset.u)/100+'px');marker.style.setProperty('--y',y+height*Number(marker.dataset.v)/100+'px');}
}
new ResizeObserver(placeSpecimens).observe(comparisonImage);comparisonImage.addEventListener('load',placeSpecimens);
function selectSpecimen(id){
 for(const button of document.querySelectorAll('[data-specimen]'))button.setAttribute('aria-pressed',String(button.dataset.specimen===id));
 for(const marker of markers.children)marker.toggleAttribute('data-active',marker.dataset.specimenMarker===id);
}
for(const button of document.querySelectorAll('[data-specimen]'))button.onclick=()=>selectSpecimen(button.dataset.specimen);
selectSpecimen('A');
function setLanguage(value,notify=false){
 if(!['zh','en'].includes(value))return;
 const anchor=[...document.querySelectorAll('[data-topic]')].findLast(node=>node.getBoundingClientRect().top<=scroller.getBoundingClientRect().top+80);
 const before=anchor?.getBoundingClientRect().top;
 language=value;root.lang=value==='zh'?'zh-CN':'en';
 for(const node of document.querySelectorAll('[data-zh][data-en]'))node.textContent=label(node);
 for(const node of document.querySelectorAll('[data-alt-zh]'))node.alt=value==='zh'?node.dataset.altZh:node.dataset.altEn;
 for(const node of document.querySelectorAll('[data-aria-zh]'))node.setAttribute('aria-label',value==='zh'?node.dataset.ariaZh:node.dataset.ariaEn);
 for(const button of document.querySelectorAll('[data-archive-language]'))button.setAttribute('aria-pressed',String(button.dataset.archiveLanguage===value));
 for(const button of photos)button.dataset.loadError=value==='zh'?'图片暂未载入，点击重试。':'Image unavailable. Select to retry.';
 if(anchor)scroller.scrollTop+=anchor.getBoundingClientRect().top-before;
 if(dialog.open)describePhoto();
 if(notify){try{localStorage.setItem('portfolio-language',value);}catch{}if(parent!==window)parent.postMessage({type:'design-terminal:case-language',language:value},location.origin);}
 update();
}
for(const button of document.querySelectorAll('[data-archive-language]'))button.onclick=()=>setLanguage(button.dataset.archiveLanguage,true);
document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement && event.target.closest('.archive-media'))event.target.closest('.archive-media').classList.add('image-failed');},true);
const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.dataset.revealState='visible';revealObserver.unobserve(entry.target);}},{root:scroller,threshold:.07,rootMargin:'0px 0px -25px 0px'});
function motionPolicy(){
 root.dataset.archiveMotion=reduce()?'reduced':'full';
 const rect=scroller.getBoundingClientRect();
 for(const node of document.querySelectorAll('.reveal')){
  if(reduce()||node.getBoundingClientRect().top<rect.bottom-15)node.dataset.revealState='visible';
  else if(node.dataset.revealState!=='visible'){node.dataset.revealState='pending';revealObserver.observe(node);}
 }
}
motion.addEventListener('change',motionPolicy);
addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin)return;
 const data=event.data||{};
 if(data.type==='design-terminal:case-language')setLanguage(data.language);
 if(data.type==='design-terminal:case-policy'){parentReduced=Boolean(data.reduced);motionPolicy();}
 if(data.type==='design-terminal:pause'){paused=true;cancelAnimationFrame(frame);frame=0;}
 if(data.type==='design-terminal:resume'){paused=false;motionPolicy();schedule();}
});
addEventListener('resize',schedule);addEventListener('pagehide',()=>{store();cancelAnimationFrame(frame);});
let initialLanguage='zh';try{const saved=localStorage.getItem('portfolio-language');if(['zh','en'].includes(saved))initialLanguage=saved;}catch{}
setLanguage(new URLSearchParams(location.search).get('lang')||initialLanguage);motionPolicy();
const fragment=fragmentId();
if(fragment&&document.getElementById(fragment)){const record=history.state?.archiveRead;go(fragment,{push:false,scroll:record?.document===documentKey?record.scroll:undefined,focus:false});}
else history.replaceState(historyState(),'',location.pathname+location.search+'#eng-prologue');
addEventListener('load',()=>{if(fragment&&document.getElementById(fragment))requestAnimationFrame(()=>{const record=history.state?.archiveRead;go(fragment,{push:false,scroll:record?.document===documentKey?record.scroll:undefined,focus:false});});},{once:true});
update();
