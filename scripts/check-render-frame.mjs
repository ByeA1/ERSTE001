import assert from 'node:assert/strict';
import test from 'node:test';
import { RenderFrameLimiter } from '../public/cases/shared/render-frame.js';

function sample(limiter, start, seconds, refreshRate, cpuMs, allowHighRefresh = true) {
  let draws = 0;
  for (let i = 0; i < seconds * refreshRate; i++) {
    if (limiter.admit(start + i * 1000 / refreshRate, allowHighRefresh)) {
      limiter.recordFrame(cpuMs);
      draws++;
    }
  }
  return draws;
}

test('an ordinary 60 Hz display stays at 60 FPS', () => {
  const limiter = new RenderFrameLimiter();
  assert.equal(sample(limiter, 0, 5, 60, 2), 300);
  assert.equal(limiter.fpsLimit, 60);
});

test('high render cost or a low quality tier keeps the 60 FPS budget', () => {
  for (const [cpuMs, allowed] of [[7, true], [2, false]]) {
    const limiter = new RenderFrameLimiter();
    assert.equal(sample(limiter, 0, 5, 144, cpuMs, allowed), 300);
    assert.equal(limiter.fpsLimit, 60);
  }
});

test('fast 120, 144 and 240 Hz displays can reach but stay capped at 120 FPS', () => {
  for (const refreshRate of [120, 144, 240]) {
    const limiter = new RenderFrameLimiter();
    assert.equal(sample(limiter, 0, 2, refreshRate, 2), 120);
    sample(limiter, 2000, 1, refreshRate, 2);
    assert.equal(limiter.fpsLimit, 120);
    assert.equal(sample(limiter, 3000, 5, refreshRate, 2), 600);
  }
});

test('a sustained load increase drops to 60 before retrying high refresh', () => {
  const limiter = new RenderFrameLimiter();
  sample(limiter, 0, 3, 144, 2);
  assert.equal(limiter.fpsLimit, 120);
  sample(limiter, 3000, 2, 144, 10);
  assert.equal(limiter.fpsLimit, 60);
  assert.equal(sample(limiter, 5000, 5, 144, 2), 300);
  assert.equal(limiter.fpsLimit, 60);
  sample(limiter, 10000, 4, 144, 2);
  assert.equal(limiter.fpsLimit, 120);
});

test('a stall does not submit catch-up renders and a resumed surface requalifies', () => {
  const limiter = new RenderFrameLimiter();
  sample(limiter, 0, 3, 144, 2);
  assert.equal(limiter.fpsLimit, 120);
  assert.equal(limiter.admit(5000), true);
  assert.equal(limiter.admit(5000), false);
  assert.equal(limiter.fpsLimit, 60);
  limiter.reset();
  assert.equal(limiter.admit(5001), true);
  assert.equal(limiter.admit(5010), false);
});
