import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {renderArchive} from '../public/cases/erste002/engineering-view.js';
import {chapters,topics} from '../public/cases/erste002/engineering-content.js';
const {chromium}=createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const assets=JSON.parse(await readFile(new URL('../public/cases/erste002/engineering-assets.json',import.meta.url),'utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
let extracted;
try{
 const page=await browser.newPage();
 extracted=await page.evaluate(html=>{
  const template=document.createElement('template');template.innerHTML=html;
  const zh=node=>node.dataset.zh||node.textContent.trim();
  return [...template.content.querySelectorAll('.e-chapter')].map(chapter=>({
   id:chapter.dataset.chapter,title:zh(chapter.querySelector('h2')),intro:zh(chapter.querySelector('.e-deck')),
   topics:[...chapter.querySelectorAll('[data-topic]')].map(topic=>({id:topic.dataset.topic,blocks:[...topic.querySelectorAll('h3,p,.e-overline,.e-stamp,.e-photo,.e-cad,.e-context img,.e-history b,.e-process > div > span,.e-version-key b,.e-assembly-path,.e-status-row')].filter(node=>!node.closest('figure')||node.matches('figure')).map(node=>{
    if(node.matches('.e-photo'))return{kind:'photo',id:node.querySelector('[data-photo]').dataset.photo,caption:zh(node.querySelector('figcaption > [data-zh]')),version:zh(node.querySelector('.e-stamp'))};
    if(node.matches('.e-cad'))return{kind:'cad'};
    if(node.matches('img'))return{kind:'context',alt:node.dataset.altZh||node.alt,src:node.getAttribute('src')};
    return{kind:node.tagName==='H3'?'heading':node.matches('.e-note')?'note':node.tagName==='P'?'paragraph':'label',text:node.matches('.e-status-row')?[...node.children].map(zh).join(' · '):zh(node)};
   })}))
  }));
 },renderArchive(assets));
}finally{await browser.close();}
const layouts={overview:'左侧大幅 FDM 斜俯视照片；右侧设计说明与证据边界。',grip:'双栏文字：左侧手感反馈与修改，右侧反馈性质及限制。',form:'错位双图：左侧 IMG_4244 竖幅俯视；右侧 IMG_4242 横向侧视，下移 90px；下方双栏说明。',hold:'整幅深灰文字块，左侧红色细线；没有握持照片。',open:'左侧当前裸壳大图；右侧开放式结构取舍与假设边界。',history:'H01 / H02 / NOW 三栏过程记录；下方注明历史阶段与照片版本不能直接等同。',reinforcement:'顶部双栏说明；P01—P04 四个选项切换同一位置的 CAD 内侧预览；下方保留文件编号与单位限制。',ribs:'左侧当前裸壳内侧大图；右侧局部加强与整体刚度的区别。',comparison:'全宽三代实体照片，完整显示比例；下方三栏 A / B / C 身份说明，再接双栏版本边界说明。',fabrication:'FDM → MJF → ASSEMBLY 三栏工艺与验证目的；没有追加照片。',assembly:'左侧三件样机侧向照片；右侧当前装配状态、历史干涉与证据限制。',stiffness:'左侧问题编号；右侧观察、原因假设与下一次验证。下方左侧 IMG_4236 局部裁切，右侧说明及完整照片入口。',buttons:'问题概述 → 双栏分析与下一次验证 → IMG_4240 正面样件背景图 → 静态照片证据边界。',packaging:'文字分析；中段四步装配关系条；下方双栏空间路径与定位固定说明。没有电池细节配图。',status:'红色顶部细线、大标题、两段阶段总结、三项 OPEN 状态和重新浏览入口。'};
const picture=file=>'../public/cases/erste002/assets/engineering/'+file;
let markdown='# ERSTE002 ENGINEERING｜当前结构、中文原文与图片编排\n\n此文件由当前页面内容直接导出，保留现有措辞与顺序；不是新的文案方案。本轮只修正 PRODUCT 开场入口的动画行为，工程档案正文和图片没有改动。桌面编排为下述基准，窄屏会折叠为单栏或简化双图。\n\n';
for(const chapter of extracted){
 const config=chapters.find(c=>c.id===chapter.id);
 markdown+=`## ${config.number} / ${config.name}\n\n**${chapter.title}**\n\n${chapter.intro}\n\n`;
 for(const [i,topic]of chapter.topics.entries()){
  const configTopic=topics.find(t=>t.id===topic.id);
  markdown+=`### ${config.number}.${i+1} ${configTopic.label[0]}\n\n**编排：**${layouts[topic.id]}\n\n关联 PRODUCT：第 ${String(configTopic.shot).padStart(2,'0')} 镜。\n\n`;
  for(const block of topic.blocks){
   if(block.kind==='photo'){
    const photo=assets.photos.find(p=>p.id===block.id);
    markdown+=`![${photo.title[0]}](${picture(photo.variants[1].file)})\n\n**${photo.id.replace('P','IMG_')}.jpeg｜${photo.title[0]}**\n\n图注原文：${block.caption}\n\n版本标注原文：${block.version}\n\n`;
   }else if(block.kind==='cad'){
    for(const item of assets.cad)markdown+=`**${item.id}** · ${item.models.map(m=>m.id+' / '+m.name).join('；')}\n\n![${item.id} 统一内侧视角](${picture(item.file)})\n\n`;
    markdown+='图注原文：统一内侧视角 / 原始坐标 / STL 单位未知 / 中性示意，非打印证据。\n\n';
   }else if(block.kind==='context')markdown+=`图片局部使用：${block.alt}。网页使用 IMG_4236 的局部裁切；[查看完整来源图](${picture(block.src.split('/').at(-1))})。\n\n`;
   else if(block.kind==='heading')markdown+=`**${block.text}**\n\n`;
   else if(block.kind==='note')markdown+=`> ${block.text}\n\n`;
   else if(block.kind==='label')markdown+=`*${block.text}*\n\n`;
   else markdown+=block.text+'\n\n';
  }
 }
}
markdown+='## 图片使用总览\n\n| 页面顺序 | 图片 / 预览 | 使用位置 |\n| --- | --- | --- |\n';
let order=0;for(const c of extracted)for(const t of c.topics)for(const b of t.blocks)if(['photo','cad','context'].includes(b.kind))markdown+=`| ${++order} | ${b.id?.replace('P','IMG_')|| (b.kind==='cad'?'P01—P04 STL 内侧预览':'IMG_4236 局部重复使用')} | ${chapters.find(x=>x.id===c.id).number} / ${topics.find(x=>x.id===t.id).label[0]} |\n`;
markdown+='\n正式使用 8 张实物照片；IMG_4239、IMG_4243 为归档备选，当前页面未使用。当前没有手握样件、逐步装配过程、按压动态图像或电池固定细节照片。\n';
const path=new URL('../docs/2026-11-17-erste002-engineering-content.md',import.meta.url);await writeFile(path,markdown);
console.log(JSON.stringify({document:path.pathname,chapters:extracted.length,topics:extracted.reduce((n,c)=>n+c.topics.length,0),characters:markdown.length}));
