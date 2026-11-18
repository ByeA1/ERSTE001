import test from 'node:test';import assert from 'node:assert/strict';
import {recommendPreset,FixedQualitySelection,detailQuality} from '../src/quality-recommendation.ts';
import {adaptiveRenderQuality,normalizePerformanceMode} from '../src/adaptive-quality.ts';
import {qualityPresets} from '../src/render-quality.ts';
const run=(ms)=>({frameMs:ms,cpuMs:ms.map(()=>2),gpuMs:ms.map(x=>x-2),method:'test',drawCalls:400,triangles:6000000,width:3253,height:1667});
const probe=(values)=>({frameMs:[],source:'test: sustained browse',tiers:Object.fromEntries(Object.entries(values).map(([tier,ms])=>[tier,run(ms)]))});
const six=(n)=>Array(6).fill(n);
test('measure actual preset workloads, select the highest with 60-FPS headroom',()=>{
 for(const [values,tier] of [
  [{low:six(4),medium:six(5),standard:six(7),high:six(9)},'high'],
  [{low:six(4),medium:six(6),standard:six(9),high:six(14)},'standard'],
  [{low:six(4),medium:six(8),standard:six(15),high:six(23)},'medium'],
  [{low:six(8),medium:six(17),standard:six(25),high:six(35)},'low'],
  [{low:six(25),medium:six(35),standard:six(45),high:six(60)},'low'],
 ])assert.equal(recommendPreset(probe(values)),tier);
});
test('one isolated warmup spike does not defeat a consistently fast preset; repeated stalls do',()=>{
 assert.equal(recommendPreset(probe({high:[7,8,8,9,9,150],standard:six(6)})),'high');
 assert.equal(recommendPreset(probe({high:[7,8,9,9,18,22],standard:six(6)})),'standard');
});
test('missing, short, zero-draw or disjoint samples never earn a full recommendation',()=>{
 assert.equal(recommendPreset({frameMs:[1,1,1],source:'legacy'}),'medium');
 assert.equal(recommendPreset({frameMs:[],source:'unavailable'}),'medium');
 for(const ms of [[1,1,1],[],[NaN,Infinity,-1,0,0,0]])assert.equal(recommendPreset(probe({high:ms,low:six(5)})),'low');
 const p=probe({high:six(1),low:six(5)});p.tiers.high.drawCalls=0;assert.equal(recommendPreset(p),'low');
 assert.equal(recommendPreset(probe({})),'low');
});
test('startup recommendation finalizes once and owns its immutable result',()=>{
 const q=new FixedQualitySelection(),p=probe({medium:six(8),high:six(20)});q.complete(p,100);
 assert.equal(q.recommendedTier,'medium');q.setMode('recommended');assert.equal(q.mode,'medium');
 p.tiers.medium.frameMs[0]=1000;assert.equal(q.stats().tiers.medium.frameMs[0],8);
 q.complete(probe({high:six(1)}),10000);assert.equal(q.recommendedTier,'medium');assert.equal(q.tier,'medium');assert.equal(q.completedAt,100);assert.equal(q.observe,undefined);
});
test('manual and custom choices stay locked before and after startup measurement',()=>{
 for(const tier of ['high','standard','medium','low','custom']){
  const q=new FixedQualitySelection();q.setMode(tier);q.complete(probe({low:six(7),medium:six(23),standard:six(30),high:six(40)}),100);
  assert.equal(q.mode,tier);assert.equal(q.tier,tier==='custom'?'high':tier);assert.equal(q.stats().locked,true);
 }
});
test('only system detail context gets one grade of effects plus clear-cover resolution',()=>{
 const tiers=['low','medium','standard','high'];
 for(let i=0;i<4;i++){
  const tier=tiers[i],base=adaptiveRenderQuality(qualityPresets.original,tier),before=JSON.stringify(base);
  const detailed=detailQuality(base,tier,true),next=adaptiveRenderQuality(qualityPresets.original,tiers[Math.min(i+1,3)]);
  assert.equal(detailed.aoSamples,next.aoSamples);assert.equal(detailed.transmission,next.transmission);assert.equal(detailed.shadows,next.shadows);
  assert.equal(detailed.scale,100);assert.equal(detailed.pixelRatio,1.5);assert.equal(JSON.stringify(base),before);
  assert.equal(detailQuality(base,tier,false),base);
 }
});
test('legacy auto migrates to system recommendation; manual presets are preserved',()=>{
 assert.equal(normalizePerformanceMode('auto'),'recommended');assert.equal(normalizePerformanceMode(null),'recommended');
 for(const mode of ['high','standard','medium','low','custom'])assert.equal(normalizePerformanceMode(mode),mode);
});
