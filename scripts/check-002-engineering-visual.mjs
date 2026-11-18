import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chapters, cases, media } from '../content/erste002-engineering-visual.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';

const { chromium } = createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const origin = process.env.ERSTE_ORIGIN || 'http://127.0.0.1:5209';
const url = `${origin}/cases/erste002/engineering.html`;
const out = process.env.ERSTE_EVIDENCE || '.audit/erste002-engineering-visual';
await mkdir(out, { recursive: true });
const specs = Object.values(mediaSpecs);
const doc = await readFile('docs/ERSTE002-engineering-final-media-spec.md', 'utf8');
assert.deepEqual([...doc.matchAll(/^### (IMG-[A-Z]\d{2})｜/gm)].map(match => match[1]), specs.map(spec => spec.id));

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { preview: url, browser: browser.version(), checks: [], metrics: {}, screenshots: [], errors: [] };
const targets = [...chapters.slice(0,4).map(([id]) => id), ...cases.map(item => `eng-case-${item.id}`), chapters[4][0]];
const trackedPages = [];

async function capture(page, name) {
  await page.evaluate(async () => {
    const box = document.querySelector('#scroller').getBoundingClientRect();
    await Promise.all([...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return image.currentSrc && rect.height > 0 && rect.top < box.bottom && rect.bottom > box.top;
    }).map(image => image.decode()));
  });
  await page.screenshot({ path: join(out, `${name}.jpg`), type: 'jpeg', quality: 88 });
  report.screenshots.push(`${name}.jpg`);
}

function track(page) {
  trackedPages.push(page);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('requestfailed', request => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) report.errors.push(request.url());
  });
}

async function visit(page, lang, id, author = false) {
  const address = `${url}?lang=${lang}${author ? '&media=1' : ''}${id ? '#'+id : ''}`;
  const response = await page.goto(address);
  assert.ok(!response || response.ok());
  await page.waitForFunction(([language, target]) => {
    if (!document.documentElement.lang.startsWith(language) || !document.body.dataset.archiveSection) return false;
    if (!target) return true;
    const node = document.getElementById(target);
    const scroller = document.querySelector('#scroller');
    const host = scroller.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return rect.top >= host.top - 1 && rect.top < host.top + host.height * .55;
  }, [lang, id]);
}

try {
  for (const [width,height,lang] of [[1920,1080,'zh'],[1440,900,'en']]) {
    const page = await browser.newPage({ viewport:{width,height}, reducedMotion:'reduce', serviceWorkers:'block' });
    track(page);
    const unexpected = [];
    page.on('request', request => { if (/\.glb\b|three\.module|story-(app|engine)/i.test(request.url())) unexpected.push(request.url()); });
    for (const id of targets) {
      await visit(page,lang,id);
      assert.equal(await page.locator('[data-chapter]').count(), 5);
      assert.equal(await page.locator('.engineering-case').count(), 4);
      assert.equal(await page.locator('figure[data-media-id]').count(), specs.length);
      assert.equal(await page.locator('[data-production]:visible').count(), 0);
      assert.ok(await page.locator('#scroller').evaluate(el => el.scrollWidth <= el.clientWidth + 1 && window.scrollY === 0));
      await capture(page, `${width}-${lang}-${id.replace('eng-', '')}`);
    }
    assert.deepEqual(unexpected,[]);
    await visit(page,lang);
    report.metrics[lang] = await page.evaluate((language) => {
      const len = (value) => [...value.replace(/\s/g, '')].length;
      const texts = [...document.querySelectorAll('main p')].filter(p => !p.closest('aside,figure,details') && getComputedStyle(p).display !== 'none').map(p => p.textContent.trim()).filter(Boolean);
      const long = texts.filter(value => len(value) >= (language === 'zh' ? 75 : 135));
      return { paragraphs:texts.length, bodyCharacters:texts.reduce((total,value)=>total+len(value),0), longParagraphs:long.length, longCharacters:long.reduce((total,value)=>total+len(value),0) };
    },lang);
    report.checks.push(`${width} × ${height} ${lang}: ${targets.length} views, visitor mode, no horizontal overflow or product runtime.`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: {width:1440,height:900}, reducedMotion:'reduce', serviceWorkers:'block' });
  track(page);
  await visit(page,'zh','media-base-section',true);
  const placement = page.locator('#media-base-section');
  await placement.locator('summary').click();
  assert.ok(await placement.getByText('必须可见',{exact:true}).isVisible());
  assert.ok(await placement.getByText('建议标注',{exact:true}).isVisible());
  await capture(page,'1440-zh-media-spec');
  const cards = await page.locator('figure[data-media-id]').evaluateAll(figures => figures.map(figure => ({id:figure.dataset.mediaId, fields:figure.querySelectorAll('.material-card dt').length, status:figure.querySelector('.material-state')?.textContent})));
  assert.deepEqual(cards.map(card=>card.id),specs.map(spec=>spec.id));
  assert.ok(cards.every(card=>card.fields===10 && ['待制作','临时占位'].includes(card.status)));
  await visit(page,'zh','media-cover',true);
  await page.locator('#media-cover summary').click();
  assert.ok(await page.locator('#media-cover .material-card dd').filter({hasText:'p4238-1536.webp'}).isVisible());
  report.checks.push(`${cards.length} distinct production cards, one per placement, including the temporary photos, CAD and diagrams; Markdown matches in order.`);
  await visit(page,'zh','eng-overview');
  await page.locator('#media-cover button').click();
  assert.ok(await page.locator('.media-dialog').isVisible());
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.media-dialog').getAttribute('data-media-slot'),'form-fdm');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#media-cover button').evaluate(button=>document.activeElement === button));
  await page.locator('[data-chapter-next]').click();
  await page.waitForFunction(()=>document.body.dataset.archiveSection === 'eng-form');
  await page.goBack();
  await page.waitForFunction(()=>document.body.dataset.archiveSection === 'eng-overview');
  await page.goForward();
  await page.waitForFunction(()=>document.body.dataset.archiveSection === 'eng-form');
  await page.locator('[data-archive-language=en]').click();
  await page.waitForFunction(()=>document.documentElement.lang === 'en');
  await page.reload();
  await page.waitForFunction(()=>document.body.dataset.archiveSection === 'eng-form');
  await visit(page,'zh','media-button-cad');
  assert.ok(await page.locator('#media-button-cad .geometry-trace').isVisible());
  await capture(page,'1440-zh-button-cad');
  for (const slot of Object.keys(media)) {
    const image = page.locator(`#media-${slot} img`);
    await image.evaluate(node=> { const tray = node.closest('details'); if (tray) tray.open=true; });
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(node=>node.decode());
  }
  const response = await page.goto(`${url}#eng-refinement-button`);
  assert.ok(!response || response.ok());
  await page.waitForFunction(()=>Math.abs(document.querySelector('#eng-case-button').getBoundingClientRect().top - document.querySelector('#scroller').getBoundingClientRect().top - 16) <= 2);
  report.checks.push(`${Object.keys(media).length} images decoded; zoom, keyboard, focus, progress, browser history, old topic anchor and locale switch passed.`);
  await page.close();

  const mobile = await browser.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:'reduce', serviceWorkers:'block' });
  track(mobile);
  await visit(mobile,'zh','eng-case-button');
  assert.ok(await mobile.locator('#scroller').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  await visit(mobile,'en','eng-current');
  assert.ok(await mobile.locator('.status-wrap').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  report.checks.push('390px layout smoke test: diagram and status table; full mobile review not in scope.');
  assert.deepEqual(report.errors,[]);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = error.stack;
  throw error;
} finally {
  await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  await Promise.all(trackedPages.filter(page=>!page.isClosed()).map(page=>page.close()));
  await browser.close();
}
console.log(JSON.stringify({ checks:report.checks, metrics:report.metrics, screenshots:report.screenshots.length },null,2));
