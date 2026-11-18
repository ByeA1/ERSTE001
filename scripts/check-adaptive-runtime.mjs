/**
 * Adaptive runtime checks for the ERSTE terminal.
 *
 * Pure-logic tests: tier thresholds, cooldowns, manual mode and the quality
 * mapping must behave without touching the DOM or the renderer.
 *
 * Run: node --experimental-strip-types --test scripts/check-adaptive-runtime.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdaptiveQuality,
  adaptivePolicy,
  adaptiveRenderQuality,
  normalizePerformanceMode,
  performanceLabels,
} from '../src/adaptive-quality.ts';

const baseQuality = {
  scale: 100,
  pixelRatio: 2,
  shadows: 2048,
  aoSamples: 32,
  depthOfField: 1,
  antialias: 'smaa',
  aoResolution: 1,
  transmission: 1,
  anisotropy: 16,
};

function simulate(q, { interval = 33, cpu = 12, frames = 600, start = 0 } = {}) {
  let now = start;
  let rendered = true;
  for (let i = 0; i < frames; i += 1) {
    now += interval;
    q.observe(now, cpu, rendered);
  }
  return now;
}

test('manual modes pin the tier and never auto-switch', () => {
  const changes = [];
  const q = new AdaptiveQuality((tier) => changes.push(tier));
  q.setMode('low');
  assert.equal(q.tier, 'low');
  simulate(q, { interval: 40, cpu: 20 });
  assert.equal(q.tier, 'low', 'manual tier must stay pinned');
  q.setMode('high');
  simulate(q, { interval: 8, cpu: 2 });
  assert.equal(q.tier, 'high');
  assert.deepEqual(changes, ['low', 'high']);
});

test('sustained slow frames step down one tier after the cooldown', () => {
  const q = new AdaptiveQuality();
  simulate(q, { interval: 30, cpu: 20, frames: 80 });
  // warmup + window samples first, then two slow windows
  assert.equal(q.tier, 'high', 'a single slow window is not enough');
  simulate(q, { interval: 45, cpu: 20, frames: 900, start: 40_000 });
  assert.notEqual(q.tier, 'high', 'persistently slow frames must downgrade');
});

test('tiers only ever move one step, and slow then fast returns to high', () => {
  const seen = ['high'];
  const q = new AdaptiveQuality((tier) => seen.push(tier));
  let clock = 0;
  const run = (interval, frames, cpu = 4) => {
    for (let i = 0; i < frames; i += 1) {
      clock += interval;
      q.observe(clock, cpu, true);
    }
  };
  run(45, 1200, 20);
  assert.notEqual(q.tier, 'high', 'persistently slow frames must downgrade');
  const afterSlow = q.tier;
  run(8, 18000, 3);
  assert.notEqual(q.tier, afterSlow, 'long fast run must climb back');
  const order = ['low', 'medium', 'standard', 'high'];
  let index = order.indexOf('high');
  for (const tier of seen.slice(1)) {
    const next = order.indexOf(tier);
    assert.equal(Math.abs(next - index), 1, `jumped from ${order[index]} to ${tier}`);
    index = next;
  }
  assert.equal(q.tier, 'high');
});



test('hidden frames reset the sampler instead of counting as slow', () => {
  const q = new AdaptiveQuality();
  simulate(q, { interval: 30, cpu: 10, frames: 60 });
  for (let i = 0; i < 200; i += 1) q.observe(1_000_000 + i * 500, 0, false);
  q.observe(1_200_000, 8, true);
  assert.equal(q.tier, 'high', 'paused rendering must not be treated as slow');
});

test('a real 60 FPS render cadence can recover even when high-refresh slots are skipped', () => {
  const q = new AdaptiveQuality();
  let now = simulate(q, { interval: 45, cpu: 20, frames: 1200 });
  assert.equal(q.tier, 'low');
  for (let i = 0; i < 9000; i++) {
    now += 1000/60;
    q.observe(now, 3, true, 1000/120);
  }
  assert.equal(q.tier, 'high');
});

test('quality mapping caps resolution and effects without touching geometry', () => {
  const medium = adaptiveRenderQuality(baseQuality, 'medium');
  const low = adaptiveRenderQuality(baseQuality, 'low');
  const high = adaptiveRenderQuality(baseQuality, 'high');

  assert.deepEqual(high, baseQuality, 'high keeps the authored quality');
  assert.equal(medium.pixelRatio, 1.5);
  assert.equal(low.pixelRatio, 1);
  assert.ok(medium.scale <= 85 && low.scale <= 50);
  assert.ok(medium.shadows <= 1024 && low.aoSamples <= 16);
  assert.equal(low.depthOfField, 0);
  assert.equal(medium.antialias,'off');
  assert.equal(medium.depthOfField,0);
  assert.equal(low.aoSamples,0);
  assert.equal(low.shadows,1024);
  assert.equal(low.transmission,.25);
});

test('automatic changes are restricted to the existing rendering controls',()=>{
  const allowed=new Set(['scale','pixelRatio','antialias','shadows','aoSamples','aoResolution','depthOfField','transmission','anisotropy']);
  const input={...baseQuality,motion:{preset:'full'},controls:{drag:true},geometry:'original',lighting:'authored'};
  for(const tier of ['high','standard','medium','low']){
    const output=adaptiveRenderQuality(input,tier);
    for(const key of Object.keys(output))if(output[key]!==input[key])assert.ok(allowed.has(key),key);
    assert.equal(output.motion,input.motion);assert.equal(output.controls,input.controls);
    assert.equal(output.geometry,input.geometry);assert.equal(output.lighting,input.lighting);
  }
});

test('sustained 45 FPS is below the interactive budget and now steps down', () => {
  const q=new AdaptiveQuality();
  const end=simulate(q,{interval:1000/45,cpu:6,frames:200});
  assert.equal(q.tier,'standard');
  simulate(q,{interval:1000/45,cpu:6,frames:200,start:end});
  assert.equal(q.tier,'medium','sustained load steps through the additional tier');
  simulate(q,{interval:1000/45,cpu:6,frames:220,start:end+200*1000/45});
  assert.equal(q.tier,'low');
});

test('fast callbacks cannot hide an actual 40 FPS drawing rate',()=>{
  const q=new AdaptiveQuality();let now=0;
  for(let i=0;i<600;i++){now+=25;q.observe(now,4,true,1000/120)}
  assert.equal(q.tier,'low');
  assert.ok(q.stats().meanDrawMs>=25);
});

test('a quantized 60 FPS limit on a 144 Hz display does not falsely reduce quality',async()=>{
  const {RenderFrameLimiter}=await import('../public/cases/shared/render-frame.js');
  const limiter=new RenderFrameLimiter(),q=new AdaptiveQuality();
  for(let i=0;i<144*20;i++){
    const now=i*1000/144;
    if(limiter.admit(now,false))q.observe(now,3,true,1000/144);
  }
  assert.equal(q.tier,'high');assert.ok(q.stats().meanDrawMs<17);
});

test('ordinary 60 FPS with occasional jitter retains the complete look', () => {
  const q=new AdaptiveQuality();let now=0;
  for(let i=0;i<3600;i++){now+=i%17===0?24:1000/60;q.observe(now,4,true)}
  assert.equal(q.tier,'high');
});

test('policy numbers stay in a sane range', () => {
  assert.ok(adaptivePolicy.warmupMs >= 1000);
  assert.ok(adaptivePolicy.cooldownMs >= adaptivePolicy.windowMs);
  assert.ok(adaptivePolicy.upgradeCooldownMs > adaptivePolicy.cooldownMs);
  assert.deepEqual(normalizePerformanceMode('bogus'), 'recommended');
  assert.equal(performanceLabels.auto.length > 0, true);
});
