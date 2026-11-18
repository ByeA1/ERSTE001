import test from 'node:test';import assert from 'node:assert/strict';
import {automaticTiers,AdaptiveQuality,adaptiveRenderQuality,selectedQuality,normalizePerformanceMode} from '../src/adaptive-quality.ts';
import {qualityPresets} from '../src/render-quality.ts';
import {PROJECT_COVER,containHero,heroSource} from '../src/project-cover.ts';
import {readFileSync} from 'node:fs';
test('four distinct monotonic automatic tiers preserve the full original baseline',()=>{
 assert.equal(automaticTiers.length,4);const values=automaticTiers.map(t=>adaptiveRenderQuality(qualityPresets.original,t));
 assert.equal(new Set(values.map(v=>JSON.stringify(v))).size,4);
 assert.deepEqual(values.at(-1),qualityPresets.original);
 for(let i=1;i<4;i++)for(const key of ['scale','pixelRatio','shadows','aoSamples','aoResolution','depthOfField','transmission','anisotropy'])assert.ok(values[i][key]>=values[i-1][key],key);
});
test('automatic operation visits all four tiers without skipping; pinned/custom never adapt',()=>{
 const seen=['high'];const auto=new AdaptiveQuality(t=>seen.push(t));
 for(let i=0;i<700;i++)auto.observe(i*33,16,true);
 assert.deepEqual(seen,['high','standard','medium','low']);
 for(const mode of [...automaticTiers,'custom']){
  const q=new AdaptiveQuality();q.setMode(mode,0);
  for(let i=0;i<900;i++)q.observe(i*40,20,true);
  assert.equal(q.tier,mode==='custom'?'high':mode);assert.equal(q.mode,mode);
 }
});
test('custom parameters survive any preset/automatic round-trip and output is independent',()=>{
 const custom={...qualityPresets.ultra,scale:145,transmission:.75};const before=JSON.stringify(custom);
 for(const mode of ['auto',...automaticTiers,'custom'])for(const tier of automaticTiers){
  const output=selectedQuality(qualityPresets.original,custom,mode,tier);
  if(mode==='custom')assert.deepEqual(output,custom);
  output.scale=50;assert.equal(JSON.stringify(custom),before);
 }
 assert.equal(normalizePerformanceMode('custom'),'custom');
});
test('both registered cover frames keep actual supplied silhouettes whole, at least 1.8 times taller',()=>{
 const projects=JSON.parse(readFileSync('content/projects.json','utf8')).projects;
 const bounds={erste001:[1040,285,1926,891],erste002:[1077,289,1911,901]};
 for(const p of projects){const b=bounds[p.id];if(!b)continue;
  const crop=heroSource(3000,1040,p.coverFrame),fit=containHero(crop.width,crop.height),scale=fit.width/crop.width;
  assert.ok(crop.x<=b[0]&&crop.y<=b[1]&&crop.x+crop.width>=b[2]&&crop.y+crop.height>=b[3]);
  const oldScale=Math.min(1472/3000,510/1040);
  assert.ok(scale/oldScale>=1.8);
  assert.ok(fit.x>=PROJECT_COVER.hero.x&&fit.y>=PROJECT_COVER.hero.y);
  assert.ok(fit.y+fit.height<=PROJECT_COVER.dividerY);
 }
});
test('unframed future projects retain a safe centered contain layout',()=>{
 assert.deepEqual(heroSource(1000,500),{x:0,y:0,width:1000,height:500});
 const fit=containHero(1000,500);assert.ok(fit.width<=1512&&fit.height<=642);
 const clamped=heroSource(1000,500,{x:-1,y:2,width:10,height:10});
 assert.ok(clamped.x>=0&&clamped.y>=0&&clamped.x+clamped.width<=1000&&clamped.y+clamped.height<=500);
});
