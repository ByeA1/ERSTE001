// Optional local evidence renderer. Original STL files/ZIP members are read only.
// Uses an already available Playwright installation; no CAD files enter public/.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
let playwright;
for(const module of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', '../.audit/model-logo/tools/node_modules/playwright'].filter(Boolean)){
 try{playwright=require(module);break;}catch{}
}
if(!playwright)throw Error('An existing Playwright installation is required. The read-only inventory scanner can run without it.');
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const derived=path.resolve(process.env.ERSTE_RENDER_ROOT ?? path.join(repo,'_archive/ERSTE002/_derived'));
const report=JSON.parse(await fs.readFile(process.env.ERSTE_STL_INVENTORY ?? path.join(derived,'inventory-latest.json'),'utf8'));
const rows=[];
for(const parent of report.records){
 if(parent.sha256 && createHash('sha256').update(await fs.readFile(parent.locator)).digest('hex')!==parent.sha256)
  throw Error('Source changed since inventory; rescan before rendering: '+parent.locator);
 for(const member of parent.members??[parent])if(member.geometry?.parser.startsWith('STL')){
  const data=parent.members ? execFileSync('python',['-c',
   'import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); sys.stdout.buffer.write(z.read(sys.argv[2]))',parent.locator,member.originalName],{maxBuffer:256*1024*1024}) : await fs.readFile(parent.locator);
  if(createHash('sha256').update(data).digest('hex')!==member.sha256)throw Error('Mesh changed since inventory: '+member.locator);
  rows.push({data,source:member,package:parent.originalName,packageHash:parent.sha256});
 }
}
if(!rows.length)throw Error('No readable STL meshes in the local inventory.');
const packages=[...new Set(rows.map(row=>row.packageHash))];
const names=rows.map((row,index)=>({...row.source,id:'M'+String(index+1).padStart(3,'0'),package:row.package,
 packageId:'P'+String(packages.indexOf(row.packageHash)+1).padStart(2,'0')}));
const config={models:names,inventoryScannedAtUtc:report.scannedAtUtc,renderedAtUtc:new Date().toISOString(),unit:'unknown / STL file coordinates',rotationApplied:false,scaleApplied:1,
 camera:{upper:[155,-175,145],inside:[135,-155,-115],up:[0,0,1],target:[0,0,18],orthographicHeight:145},
 views:{upper:{label:'斜上视图',position:[155,-175,145],target:[0,0,18],height:145},
  inside:{label:'内侧视图',position:[135,-155,-115],target:[0,0,18],height:145},
  sidewall:{label:'X+ 侧壁局部',position:[170,-50,-30],target:[20,5,10],height:80},
  ribs:{label:'后部筋板局部',position:[90,140,-100],target:[0,30,17],height:75},
  transverse:{label:'横向构件区域',position:[75,-50,-120],target:[0,10,5],height:95},
  mounting:{label:'前部安装区域 / PCB 对应关系待核',position:[90,-145,-90],target:[0,-35,12],height:85},
  buttons:{label:'按键盖内侧',position:[80,-120,-105],target:[0,-25,17],height:85}},
 warning:'Incoming P labels are temporary package labels, not REV assignments. Neutral visualization, not material or print evidence.'};
const preview=path.join(derived,'previews');await fs.mkdir(preview,{recursive:true});
const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#edf0f2;color:#222c34;font-family:"Segoe UI","Microsoft YaHei",sans-serif}header{height:104px;padding:18px 32px;border-bottom:1px solid #aab5bd}h1{font-size:23px;margin:0 0 8px}p{font-size:13px;margin:0;color:#4a5965}canvas{display:block;width:1280px;height:790px}footer{height:66px;padding:14px 32px;font-size:13px;line-height:1.6;border-top:1px solid #aab5bd}
</style><header><h1 id="title"></h1><p id="source"></p></header><canvas></canvas><footer>只读网格观察 · STL 单位未声明 · 原始坐标 / 同一正交机位 / 无单件缩放<br>收件包 P 编号不是正式 REV；图中颜色为中性示意，不代表材料、打印工艺或实物证据。</footer>
<script type="importmap">{"imports":{"three":"/lib/three.module.js"}}</script><script type="module">
import * as THREE from 'three';import {STLLoader} from '/lib/STLLoader.js';
const c=await(await fetch('/config')).json();const scene=new THREE.Scene();scene.background=new THREE.Color('#edf0f2');
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(1280,790);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
scene.add(new THREE.HemisphereLight(0xf2f7ff,0x6b727b,1.3));
for(const [position,intensity] of [[[100,-100,180],2.5],[[-130,60,80],1.4],[[90,120,-90],1.1]]){const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.fromArray(position);scene.add(light)}
const height=c.camera.orthographicHeight,width=height*1280/790;const camera=new THREE.OrthographicCamera(-width/2,width/2,height/2,-height/2,1,1200);camera.up.fromArray(c.camera.up);
const loader=new STLLoader();const meshes=await Promise.all(c.models.map(async(_,i)=>{const geometry=loader.parse(await(await fetch('/mesh/'+i)).arrayBuffer());const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#9ba7af',metalness:0,roughness:.62,side:THREE.DoubleSide}));mesh.visible=false;scene.add(mesh);return mesh}));
window.renderEngineering=(indices,view,title)=>{for(let i=0;i<meshes.length;i++)meshes[i].visible=indices.includes(i);const v=c.views[view];camera.top=v.height/2;camera.bottom=-v.height/2;camera.left=-v.height*1280/790/2;camera.right=-camera.left;camera.position.fromArray(v.position);camera.lookAt(...v.target);camera.updateProjectionMatrix();renderer.render(scene,camera);document.querySelector('#title').textContent=title+' / '+v.label;document.querySelector('#source').textContent=indices.map(i=>c.models[i].id+' · '+c.models[i].originalName).join(' / ');};window.__engineeringReady=true;
</script></html>`;
const files={'/lib/three.module.js':'node_modules/three/build/three.module.js','/lib/three.core.js':'node_modules/three/build/three.core.js','/lib/STLLoader.js':'node_modules/three/examples/jsm/loaders/STLLoader.js'};
const server=createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://localhost');let data,type;
  if(url.pathname==='/'){data=html;type='text/html';}
  else if(url.pathname==='/config'){data=JSON.stringify(config);type='application/json';}
  else if(/^\/mesh\/\d+$/.test(url.pathname)){data=rows[Number(url.pathname.split('/').pop())]?.data;type='application/octet-stream';}
  else if(files[url.pathname]){data=await fs.readFile(path.join(repo,files[url.pathname]));type='text/javascript';}
  if(data===undefined){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':type+'; charset=utf-8'}).end(data);
 }catch{res.writeHead(500).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await playwright.chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:960},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.__engineeringReady);
 for(const [index,model] of names.entries())for(const view of ['upper','inside',...(model.originalName.includes('按键')?['buttons']:[])]){
  await page.evaluate(({indices,view,title})=>window.renderEngineering(indices,view,title),{indices:[index],view,title:model.packageId+' / '+model.id+' / 版本归属待核对'});
  await page.screenshot({path:path.join(preview,model.id+'-'+view+'.png')});
 }
 for(const packageId of [...new Set(names.map(row=>row.packageId))])for(const view of ['upper','inside','sidewall','ribs','transverse','mounting']){
  const indices=names.map((row,i)=>row.packageId===packageId && (['upper','inside'].includes(view)||!row.originalName.includes('按键'))?i:-1).filter(i=>i>=0);
  await page.evaluate(({indices,view,title})=>window.renderEngineering(indices,view,title),{indices,view,title:packageId+' / 原始坐标叠加，仅作候选装配观察'});
  await page.screenshot({path:path.join(preview,packageId+'-'+view+'.png')});
 }
 for(const view of ['upper','inside','sidewall','ribs','transverse','mounting']){
  const tiles=await Promise.all([...new Set(names.map(row=>row.packageId))].map(async id=>`<article><img src="data:image/png;base64,${(await fs.readFile(path.join(preview,id+'-'+view+'.png'))).toString('base64')}"></article>`));
  await page.setViewportSize({width:2000,height:Math.ceil(tiles.length/2)*750+120});
  await page.setContent(`<meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#dce1e5;font-family:"Segoe UI","Microsoft YaHei",sans-serif}h1{height:80px;margin:0;padding:24px;font-size:24px}main{display:grid;grid-template-columns:1fr 1fr;gap:2px}img{display:block;width:100%}</style><h1>候选收件包统一机位对照 / ${config.views[view].label} / 正式 REV 对应关系未确认</h1><main>${tiles.join('')}</main>`);
  await page.screenshot({path:path.join(preview,'packages-'+view+'.png'),fullPage:true});
 }
 if(errors.length)throw Error(errors.join('\n'));
 const rendererHash=createHash('sha256').update(await fs.readFile(fileURLToPath(import.meta.url))).digest('hex');
 config.rendererSha256=rendererHash;
 config.renderSetId=createHash('sha256').update(JSON.stringify({rendererHash,sources:names.map(({sha256,originalName,packageId})=>({sha256,originalName,packageId}))})).digest('hex').slice(0,20);
 await fs.writeFile(path.join(preview,'preview-provenance.json'),JSON.stringify(config,null,2)+'\n');
 const snapshot=path.join(derived,'render-runs',config.renderSetId);await fs.mkdir(snapshot,{recursive:true});
 for(const file of await fs.readdir(preview))if(file.endsWith('.png')||file==='preview-provenance.json'){
  const target=path.join(snapshot,file);
  try{await fs.copyFile(path.join(preview,file),target,1);}catch(error){if(error.code!=='EEXIST')throw error;}
 }
 console.log(`Rendered ${names.length} read-only STL meshes and ${packages.length} unassigned packages to ${preview}`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
