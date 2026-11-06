import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(path.resolve('.audit/model-logo/tools/package.json'));
const { chromium } = require('playwright');
const saved = process.argv.splice(2); process.argv.push('release/wallpaper', '4183');
const { server } = await import('./serve-cassette-review.mjs');
if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
const report = { date: new Date().toISOString(), scope: 'Compiled wallpaper mode in desktop browsers; not a Wallpaper Engine host-device acceptance', checks: [] };
try {
  for (const [name, executablePath] of [['Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'], ['Edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]) {
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      for (const [phase, time, selector] of [['boot', 5, '.boot-logo svg'], ['welcome', 20, '.welcome-logo svg']]) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto(`http://127.0.0.1:4183/?freeze=1&time=${time}`);
        await page.waitForFunction(() => window.rhine?.stats().ready, {}, { timeout: 60000 });
        await page.waitForFunction(s => document.querySelector(s).getAnimations({ subtree: true }).some(a => a.playState === 'running'), selector);
        const full = await page.locator(selector).evaluate(svg => ({ contour: svg.querySelector('.rhine-logo__wire').getAttribute('d'), mode: svg.dataset.logoMode, durations: svg.getAnimations({ subtree: true }).map(a => a.effect.getTiming().duration) }));
        assert.equal(full.mode, 'full'); assert.deepEqual(full.durations, [6400, 6400, 6400]);
        await page.waitForTimeout(1600);
        await page.locator(selector).screenshot({ path: `.audit/logo-unification/screenshots/${name}-wallpaper-${phase}.png` });
        await page.evaluate(() => window.rhineWallpaperHost.paused = true);
        await page.waitForFunction(s => document.querySelector(s).getAnimations({ subtree: true }).every(a => a.playState === 'paused'), selector);
        const pausedAt = await page.locator(selector).evaluate(svg => svg.getAnimations({ subtree: true })[0].currentTime);
        await page.waitForTimeout(120);
        assert.equal(await page.locator(selector).evaluate(svg => svg.getAnimations({ subtree: true })[0].currentTime), pausedAt);
        await page.evaluate(() => window.rhineWallpaperHost.paused = false);
        await page.waitForFunction(s => document.querySelector(s).getAnimations({ subtree: true }).every(a => a.playState === 'running'), selector);
        await page.evaluate(() => document.querySelector('#three-scene').dataset.adaptiveTier = 'low');
        await page.waitForFunction(s => document.querySelector(s).dataset.logoMode === 'light', selector);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(s => document.querySelector(s).dataset.logoMode === 'still', selector);
        assert.equal(errors.length, 0, JSON.stringify(errors));
        report.checks.push({ browser: name, phase, full, hostPauseResume: true, low: true, reduced: true, errors });
        await page.close();
      }
    } finally { await browser.close(); }
  }
} finally { await new Promise(resolve => server.close(resolve)); process.argv.splice(2); process.argv.push(...saved); await fs.writeFile('.audit/logo-unification/wallpaper.json', JSON.stringify(report, null, 2)); }
console.log('Compiled wallpaper boot/welcome, shared rhythm, host pause/resume and reduced modes passed.');
