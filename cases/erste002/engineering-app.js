import {chapters,topics,productToTopic,topicById,parseRoute} from './engineering-content.js';
import {bi,renderArchive} from './engineering-view.js';

const key='erste002:routes:v1';
const defaults={product:{shot:1},engineering:{topic:'overview',scroll:0}};
function readPositions(){
  try {
    const value=JSON.parse(sessionStorage.getItem(key));
    return {product:{shot:Math.max(1,Math.min(11,Number(value?.product?.shot)||1))},engineering:{topic:topicById(value?.engineering?.topic)?.id||'overview',scroll:Math.max(0,Number(value?.engineering?.scroll)||0)}};
  }catch{return structuredClone(defaults);}
}
export function createEngineeringArchive(bridge) {
  const main=document.querySelector('#story');
  let positions=readPositions(), state=parseRoute(location.hash), assets=null, applying=false, scrollFrame=0, photoIndex=0, lastProduct=state.shot||1;
  const initialHistory=history.state?.erste002;
  let initiated=false, pendingJump=null, returnFocus=null;
  document.body.dataset.route=state.route;
  const band=document.createElement('nav');
  band.className='route-band';band.setAttribute('aria-label','PRODUCT / ENGINEERING');
  band.innerHTML=`<span class="route-current"></span><span class="route-context"></span><button type="button" class="route-saved"></button><a class="route-related" href="#engineering/overview"></a>`;
  const entrance=document.createElement('div');
  entrance.className='route-entrance';entrance.hidden=true;
  entrance.innerHTML=`<a href="#product/02" data-explore-product>EXPLORE PRODUCT ↗${bi('进入产品路线','Continue the product story')}</a><a href="#engineering/overview" data-engineering-topic="overview">ENGINEERING ARCHIVE ↗${bi('进入工程档案','Enter the engineering archive')}</a>`;
  const archive=document.createElement('section');archive.id='engineering';archive.hidden=state.route!=='engineering';
  archive.setAttribute('aria-label','ERSTE002 / ENGINEERING ARCHIVE');
  archive.innerHTML=`<nav class="archive-index" aria-label="Engineering chapters">${chapters.map((c,i)=>`<a href="#engineering/${topics.find(t=>t.chapter===c.id).id}" data-engineering-topic="${topics.find(t=>t.chapter===c.id).id}"><b>${c.number}</b><span>${c.name}</span></a>`).join('')}</nav><div id="scroller" tabindex="0" aria-label="Engineering archive"><div class="archive-body"><p class="e-load-error" role="status">${bi('正在读取工程档案…','Loading engineering archive…')}</p></div></div><footer class="archive-footer"><output aria-live="polite"></output><span class="e-track" aria-hidden="true"><span></span></span><button type="button" data-engineering-prev>${bi('上一章','Previous chapter')} ←</button><button type="button" data-engineering-next>${bi('下一章','Next chapter')} →</button></footer>`;
  const dialog=document.createElement('dialog');dialog.className='archive-dialog';dialog.setAttribute('aria-labelledby','archive-dialog-title');
  dialog.innerHTML=`<header><span id="archive-dialog-title">ERSTE002 / PHYSICAL EVIDENCE</span><button type="button" data-photo-close>${bi('关闭','Close')} ×</button></header><figure><img alt=""><figcaption></figcaption></figure><footer><button type="button" data-photo-step="-1">← ${bi('上一张','Previous')}</button><output></output><button type="button" data-photo-step="1">${bi('下一张','Next')} →</button></footer>`;
  main.append(band,entrance,archive);document.body.append(dialog);
  const scroller=archive.querySelector('#scroller'), content=archive.querySelector('.archive-body');
  const lang=()=>bridge.state().language;
  const text=pair=>pair[lang()==='en'?1:0];
  const localize=()=>{
    for(const node of [band,entrance,archive,dialog].flatMap(root=>[...root.querySelectorAll('[data-zh][data-en]')])) node.textContent=lang()==='en'?node.dataset.en:node.dataset.zh;
    for(const node of document.querySelectorAll('#engineering [data-alt-zh],.archive-dialog [data-alt-zh]')) node.alt=lang()==='en'?node.dataset.altEn:node.dataset.altZh;
    for(const node of archive.querySelectorAll('[data-aria-zh]')) node.setAttribute('aria-label',lang()==='en'?node.dataset.ariaEn:node.dataset.ariaZh);
    scroller.setAttribute('aria-label',text(['工程档案滚动区域','Engineering archive scrolling area']));
    archive.querySelector('.archive-index').setAttribute('aria-label',text(['工程章节','Engineering chapters']));
    if(dialog.open)paintPhoto();
    refresh();
  };
  function save(){try{sessionStorage.setItem(key,JSON.stringify(positions));}catch{/* Browsing still works with storage disabled. */}}
  function snapshot(){
    if(state.route==='engineering')positions.engineering={topic:state.topic,scroll:scroller.scrollTop};
    else positions.product={shot:bridge.state().shot};
    save();
  }
  function writeHistory(mode='replace'){
    const hash=state.route==='engineering'?`#engineering/${state.topic}`:`#product/${String(state.shot).padStart(2,'0')}`;
    history[mode==='push'?'pushState':'replaceState']({...history.state,erste002:{...state,positions:structuredClone(positions),scroll:scroller.scrollTop}},'',hash);
  }
  function refresh(){
    const product=bridge.state(), engineering=state.route==='engineering';
    const topic=topicById(engineering?state.topic:productToTopic[product.shot-1])||topics[0];
    band.querySelector('.route-current').textContent=engineering?'ENGINEERING':'PRODUCT';
    band.querySelector('.route-context').textContent=engineering?`${chapters.find(c=>c.id===topic.chapter).number} / ${text(topic.label)}`:`${String(product.shot).padStart(2,'0')} / 11`;
    const related=band.querySelector('.route-related');
    related.href=engineering?`#product/${String(topic.shot).padStart(2,'0')}`:`#engineering/${topic.id}`;
    related.textContent=engineering?`PRODUCT ${String(topic.shot).padStart(2,'0')} ↗`:'ENGINEERING ARCHIVE ↗';
    related.setAttribute('aria-label',engineering?text([`查看对应产品镜头 ${topic.shot}`,`View related product shot ${topic.shot}`]):text([`工程档案：${topic.label[0]}`,`Engineering archive: ${topic.label[1]}`]));
    const saved=band.querySelector('.route-saved');
    saved.textContent=text(['续看','Resume'])+' '+(engineering?'PRODUCT':'ARCHIVE');
    saved.title=text(['恢复另一条路线的保存位置；关联跳转使用右侧入口。','Restore the other route’s saved position. Use the right link for related content.']);
    const opening= !engineering && product.shot===1 && !product.busy && !product.free && product.loaded;
    entrance.hidden=!opening;document.body.dataset.openingChoices=String(opening);
    if(engineering){
      const ci=chapters.findIndex(c=>c.id===topic.chapter);
      archive.querySelector('.archive-footer output').textContent=`${String(ci+1).padStart(2,'0')} / 04 — ${text(topic.label)}`;
      archive.querySelector('[data-engineering-prev]').disabled=ci===0;
      const next=archive.querySelector('[data-engineering-next]');next.disabled=ci===3;
      archive.querySelector('.e-track span').style.width=((ci+1)/4*100)+'%';
      [...archive.querySelector('.archive-index').children].forEach((link,i)=>{if(ci===i)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');});
    }
  }
  function alignTopic(topic,scroll,focus=false){
    const node=content.querySelector(`#topic-${topic}`);
    if(!node){pendingJump={topic,scroll,focus};return;}
    const item=topicById(topic), first=topics.find(t=>t.chapter===item.chapter).id===topic;
    const destination=first?node.closest('.e-chapter').querySelector('.e-chapter-header'):node;
    scroller.scrollTop=Number.isFinite(scroll)?scroll:destination.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-24;
    if(focus)node.focus({preventScroll:true});
    positions.engineering={topic,scroll:scroller.scrollTop};save();
  }
  function navigate(target,{historyMode='push',restoreScroll,focus=true}={}){
    snapshot();writeHistory();applying=true;
    if(dialog.open)dialog.close();
    bridge.stopAuto();bridge.pause();
    state={...target};document.body.dataset.route=state.route;
    archive.hidden=state.route!=='engineering';
    if(state.route==='engineering'){
      state.topic=topicById(state.topic)?.id||'overview';
      alignTopic(state.topic,restoreScroll,focus);
    }else{
      state.shot=Math.max(1,Math.min(11,state.shot||1));lastProduct=state.shot;
      positions.product={shot:state.shot};
      bridge.seekShot(state.shot);bridge.resume();
      if(focus)band.querySelector('.route-related').focus({preventScroll:true});
    }
    applying=false;refresh();save();writeHistory(historyMode);
  }
  function update(){
    const product=bridge.state();
    if(state.route==='product' && !applying && initiated && product.shot!==lastProduct){
      snapshot();writeHistory();lastProduct=product.shot;state.shot=product.shot;positions.product={shot:product.shot};save();writeHistory(product.auto?'replace':'push');
    }
    refresh();
  }
  function opening(){
    initiated=true;
    if(state.route==='engineering'){bridge.stopAuto();bridge.pause();return true;}
    if(state.shot>1){applying=true;lastProduct=state.shot;bridge.seekShot(state.shot);applying=false;refresh();return true;}
    writeHistory();return false;
  }
  band.querySelector('.route-related').onclick=event=>{
    event.preventDefault();
    if(state.route==='product')navigate({route:'engineering',topic:productToTopic[bridge.state().shot-1]});
    else navigate({route:'product',shot:topicById(state.topic).shot});
  };
  band.querySelector('.route-saved').onclick=()=>{
    if(state.route==='engineering')navigate({route:'product',shot:positions.product.shot});
    else navigate({route:'engineering',topic:positions.engineering.topic},{restoreScroll:positions.engineering.scroll});
  };
  main.addEventListener('click',event=>{
    const link=event.target.closest('[data-engineering-topic],[data-related-product],[data-explore-product]');
    if(!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    event.preventDefault();
    if(link.hasAttribute('data-explore-product'))bridge.nextShot();
    else if(link.dataset.relatedProduct)navigate({route:'product',shot:topicById(link.dataset.relatedProduct).shot});
    else navigate({route:'engineering',topic:link.dataset.engineeringTopic});
  });
  for(const [selector,delta] of [['[data-engineering-prev]',-1],['[data-engineering-next]',1]])archive.querySelector(selector).onclick=()=>{
    const ci=chapters.findIndex(c=>c.id===topicById(state.topic).chapter), chapter=chapters[ci+delta];
    if(chapter)navigate({route:'engineering',topic:topics.find(t=>t.chapter===chapter.id).id});
  };
  scroller.addEventListener('scroll',()=>{
    if(scrollFrame || state.route!=='engineering')return;
    scrollFrame=requestAnimationFrame(()=>{
      scrollFrame=0;if(state.route!=='engineering' || applying)return;
      const top=scroller.getBoundingClientRect().top+90;
      const candidates=[...content.querySelectorAll('[data-topic]')];
      let current=candidates.findLast(node=>node.getBoundingClientRect().top<=top)||candidates[0];
      const chapter=[...content.querySelectorAll('[data-chapter]')].findLast(node=>node.getBoundingClientRect().top<=top);
      if(chapter && current && topicById(current.dataset.topic).chapter!==chapter.dataset.chapter)current=content.querySelector(`#topic-${topics.find(t=>t.chapter===chapter.dataset.chapter).id}`);
      if(current)state.topic=current.dataset.topic;
      snapshot();refresh();writeHistory();
    });
  },{passive:true});
  addEventListener('popstate',event=>{
    // Never replace the destination entry while handling history traversal.
    const record=event.state?.erste002, target=parseRoute(location.hash);
    applying=true;bridge.stopAuto();bridge.pause();if(dialog.open)dialog.close();
    if(record?.positions)positions=record.positions;
    state=target;document.body.dataset.route=state.route;archive.hidden=state.route!=='engineering';
    if(state.route==='engineering')alignTopic(state.topic,record?.scroll,true);
    else{lastProduct=state.shot;bridge.seekShot(state.shot);bridge.resume();}
    applying=false;save();refresh();
  });
  addEventListener('hashchange',()=>{
    const target=parseRoute(location.hash);
    if(target.route===state.route && (target.route==='engineering'?target.topic===state.topic:target.shot===state.shot))return;
    navigate(target,{historyMode:'replace'});
  });
  function paintPhoto(){
    if(!assets)return;
    const photo=assets.photos[photoIndex], image=dialog.querySelector('img');
    image.src='./assets/engineering/'+photo.variants[1].file;image.alt=text(photo.title);
    dialog.querySelector('figcaption').textContent=`${photo.id.replace('P','IMG_')} / ${text(photo.caption)}`;
    dialog.querySelector('footer output').textContent=`${String(photoIndex+1).padStart(2,'0')} / ${assets.photos.length}`;
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-photo]');if(!button||!assets)return;
    photoIndex=assets.photos.findIndex(p=>p.id===button.dataset.photo);if(photoIndex<0)return;
    returnFocus=button;paintPhoto();dialog.showModal();
  });
  dialog.querySelector('[data-photo-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
  // Capture Escape before the project host's generic Escape-to-close handler.
  document.addEventListener('keydown',event=>{
    if(!dialog.open)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();dialog.close();}
    if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();photoIndex=(photoIndex+(event.key==='ArrowLeft'?-1:1)+assets.photos.length)%assets.photos.length;paintPhoto();}
  },true);
  for(const button of dialog.querySelectorAll('[data-photo-step]'))button.onclick=()=>{photoIndex=(photoIndex+Number(button.dataset.photoStep)+assets.photos.length)%assets.photos.length;paintPhoto();};
  archive.addEventListener('click',event=>{
    const button=event.target.closest('[data-cad]');if(!button||!assets)return;
    const item=assets.cad[Number(button.dataset.cad)];
    const image=archive.querySelector('#engineering-cad-image');image.src='./assets/engineering/'+item.file;image.alt=item.id+' / '+text(['历史 STL 统一内侧视角','Historical STL, common inside view']);
    archive.querySelector('#engineering-cad-caption').textContent=item.id+' / '+item.models.map(m=>m.id+' · '+m.name).join(' / ');
    for(const tab of archive.querySelectorAll('[data-cad]'))tab.setAttribute('aria-pressed',String(tab===button));
  });
  async function load(){
    try{
      const response=await fetch('./engineering-assets.json');if(!response.ok)throw Error('HTTP '+response.status);assets=await response.json();
      content.innerHTML=renderArchive(assets);
      archive.querySelector('#engineering-cad-caption').textContent=assets.cad[0].id+' / '+assets.cad[0].models.map(m=>m.id+' · '+m.name).join(' / ');
      if(state.route==='engineering'){
        const jump=pendingJump||{topic:state.topic,scroll:initialHistory?.route==='engineering' && initialHistory.topic===state.topic ? initialHistory.scroll : undefined};alignTopic(jump.topic,jump.scroll,jump.focus);pendingJump=null;writeHistory();
      }
      localize();
    }catch(error){
      content.innerHTML=`<div class="e-load-error" role="alert">${bi('工程图片索引暂时无法载入，PRODUCT 路线仍可使用。','The engineering image index could not be loaded. The product route remains available.','p')}<button type="button" data-retry-archive>${bi('重试','Retry')}</button></div>`;
      content.querySelector('[data-retry-archive]').onclick=load;localize();console.warn('ERSTE002 archive',error.message);
    }
  }
  load();localize();
  return {update,language:localize,opening,isEngineering:()=>state.route==='engineering'};
}
