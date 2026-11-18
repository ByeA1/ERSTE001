import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chapters, cases, media } from '../content/erste002-engineering-visual.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';

const { chromium } = createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const origin = process.env.ERSTE_ORIGIN || 'http://127.0.0.1:5210';
const url = `${origin}/cases/erste002/engineering.html`;
const out = process.env.ERSTE_EVIDENCE || '.audit/erste002-engineering-visual';
await mkdir(out, { recursive: true });
const specs = Object.values(mediaSpecs);
const doc = await readFile('docs/ERSTE002-engineering-final-media-spec.md', 'utf8');
assert.deepEqual([...doc.matchAll(/^### (IMG-[A-Z]\d{2})｜/gm)].map(match => match[1]), specs.map(spec => spec.id));
assert.deepEqual([...doc.matchAll(/\[查看页面图位 IMG-[A-Z]\d{2}\]\([^\n]+engineering\.html#(IMG-[A-Z]\d{2})\)/g)].map(match => match[1]), specs.map(spec => spec.id));

const featuredCards = [mediaSpecs['support-diagram'], mediaSpecs['button-diagram'], mediaSpecs['battery-diagram'], mediaSpecs['light-diagram']];
assert.ok(featuredCards.every(card=>card.production[0] === 'NX 截图' && card.composition));

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { preview: url, browser: browser.version(), checks: [], metrics: {}, screenshots: [], errors: [] };
const targets = [
  ...chapters.slice(0,2).map(([id]) => id), 'eng-form-handling',
  ...chapters.slice(2,4).map(([id]) => id), ...cases.map(item => `eng-case-${item.id}`), chapters[4][0],
];
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

async function visit(page, lang, id) {
  const address = `${url}?lang=${lang}${id ? '#'+id : ''}`;
  const response = await page.goto(address);
  assert.ok(!response || response.ok());
  await page.waitForFunction(([language, target]) => {
    if (!document.documentElement.lang.startsWith(language) || !document.body.dataset.archiveSection) return false;
    if (!target) return true;
    const node = document.getElementById(target);
    const scroller = document.querySelector('#scroller');
    const host = scroller.getBoundingClientRect();
    const rect = (node.matches('figcaption') ? node.closest('figure') : node).getBoundingClientRect();
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
      assert.equal(await page.locator('.material-card,.author-mode,[data-production]').count(), 0);
      assert.ok(await page.locator('#scroller').evaluate(el => el.scrollWidth <= el.clientWidth + 1 && window.scrollY === 0));
      await capture(page, `${width}-${lang}-${id.replace('eng-', '')}`);
    }
    assert.deepEqual(unexpected,[]);
    assert.equal(await page.locator('#engineering-archive figure svg').count(),0);
    for (const card of featuredCards) {
      const frame = page.locator(`[data-media-id="${card.id}"] .figure-plate`);
      assert.equal(await frame.innerText(),card.id);
      assert.equal(Number(await frame.getAttribute('data-columns')) || 1,card.composition.columns);
      const { width:frameWidth, height:frameHeight } = await frame.boundingBox();
      const [horizontal,vertical] = card.ratio.split(':').map(Number);
      assert.ok(Math.abs(frameWidth / frameHeight - horizontal / vertical) < .01,card.id);
    }
    const photoFrame = await page.locator('#media-stiffness-photo .image-open').boundingBox();
    const cadFrame = await page.locator('[data-media-id="IMG-S02"] .figure-plate').boundingBox();
    assert.equal(photoFrame.y,cadFrame.y);
    assert.ok(Math.abs(photoFrame.width - cadFrame.width) < .05);
    assert.ok(Math.abs(photoFrame.height - cadFrame.height) < .05);
    report.checks.push(`${width} × ${height} ${lang}: four numbered CAD positions match their specified aspect ratios, and S01/S02 align.`);
    const copy = await page.locator('#engineering-archive').textContent();
    assert.doesNotMatch(copy,/尚未提供|未提供|待提供|未收录|缺图|待补图|建议补充|技术素材卡|现有素材评估|最终素材要求|临时占位|待制作|明确占位|_archive[\\/]|image unavailable|not yet supplied|final media spec|temporary media review|awaiting production|placeholder/i);
    await visit(page,lang,'eng-form-handling');
    const grip = await page.locator('#eng-form-handling').evaluate(section=>{
      const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      const heading = section.querySelector('h3');
      const caption = section.querySelector('figcaption');
      return {
        heading: box('#handling-title'), headingFont: parseFloat(getComputedStyle(heading).fontSize),
        captionFont: parseFloat(getComputedStyle(caption).fontSize),
        profile: box('#media-form-profile .image-open'), grip: box('#media-grip .figure-plate'),
        open: section.querySelector('details').open,
      };
    });
    assert.ok(grip.heading.bottom < grip.profile.top && grip.headingFont >= grip.captionFont * 2);
    assert.equal(grip.open,false);
    assert.equal(grip.profile.top,grip.grip.top);
    assert.equal(grip.profile.width,grip.grip.width);
    assert.equal(grip.profile.height,grip.grip.height);
    assert.ok(Math.abs(grip.profile.width / grip.profile.height - 1.6) < .01);
    assert.equal(await page.locator('#media-grip .figure-plate').innerText(),'IMG-F04');
    report.checks.push(`${width} × ${height} ${lang}: ${grip.profile.width} × ${grip.profile.height} grip frames align; figure captions are secondary and production notes are absent.`);
    if (width === 1920) {
      const measured = await page.locator('figure[data-media-id]').evaluateAll(figures=>{
        document.querySelectorAll('.study-tray').forEach(tray=>{ tray.open = true; });
        return figures.map(figure=>({id:figure.dataset.mediaId, width:figure.getBoundingClientRect().width}));
      });
      for (const [index, spec] of specs.entries()) {
        assert.equal(measured[index].id,spec.id);
        assert.ok(Math.abs(measured[index].width-spec.width)<=5,`${spec.id}: measured ${measured[index].width}, spec ${spec.width}`);
      }
      await page.locator('.study-tray').evaluateAll(trays=>trays.forEach(tray=>{ tray.open = false; }));
      report.checks.push('All 35 production widths match the 1920px layout within 5 CSS px.');
    }
    await visit(page,lang);
    report.metrics[lang] = await page.evaluate((language) => {
      const len = (value) => [...value.replace(/\s/g, '')].length;
      const texts = [...document.querySelectorAll('main p')].filter(p => !p.closest('aside,figure,details') && getComputedStyle(p).display !== 'none').map(p => p.textContent.trim()).filter(Boolean);
      const long = texts.filter(value => len(value) >= (language === 'zh' ? 75 : 135));
      return { paragraphs:texts.length, bodyCharacters:texts.reduce((total,value)=>total+len(value),0), longParagraphs:long.length, longCharacters:long.reduce((total,value)=>total+len(value),0) };
    },lang);
    report.checks.push(`${width} × ${height} ${lang}: ${targets.length} views, single public layout, no horizontal overflow or product runtime.`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: {width:1440,height:900}, reducedMotion:'reduce', serviceWorkers:'block' });
  track(page);
  await visit(page,'zh','eng-evolution');
  assert.equal(await page.locator('.milestone-finding:visible').count(),5);
  const versionCards = await page.locator('[data-version]').evaluateAll(cards=>cards.map(card=>({
    version:card.dataset.version,
    figure:card.querySelector('figure').dataset.mediaId,
    hasPhoto:Boolean(card.querySelector('img')),
    hasFields:card.querySelectorAll('.version-logic dd').length === 2 && Boolean(card.querySelector('.version-validation')?.textContent),
  })));
  assert.deepEqual(versionCards.map(card=>card.version),['V1','V2','V3','V4','V5']);
  assert.deepEqual(versionCards.map(card=>card.figure),['IMG-P01','IMG-P02','IMG-P03','IMG-P04','IMG-P05']);
  assert.deepEqual(versionCards.map(card=>card.hasPhoto),[true,false,false,true,false]);
  assert.ok(versionCards.every(card=>card.hasFields));
  assert.match(await page.locator('[data-version="V5"] .version-validation').innerText(),/CAD 已完成 · 待打样与验证/);
  assert.equal(await page.locator('.milestone-notes p:visible').count(),0);
  await page.locator('#milestone-support .milestone-notes summary').click();
  assert.match(await page.locator('#milestone-support .milestone-notes p').innerText(),/拆杆后曾完成装配/);
  await visit(page,'en','eng-case-button');
  assert.ok(await page.locator('#eng-case-button .case-lead').isVisible());
  const rationale = page.locator('#eng-case-button .evidence-notes');
  assert.equal(await rationale.isVisible(),false);
  await page.locator('#eng-case-button .case-extras summary').first().click();
  assert.ok(await rationale.isVisible());
  report.checks.push('V1–V5 have five dedicated media slots and independent goals, changes, findings and validation status. V4 is the last physical build, and V5 is CAD only.');
  await visit(page,'zh','IMG-S05');
  const placement = page.locator('#media-base-section');
  assert.ok(await placement.evaluate(figure=>figure.closest('details').open));
  assert.equal(await placement.locator('.figure-plate').innerText(),'IMG-S05');
  await capture(page,'1440-zh-numbered-plates');
  const placements = await page.locator('figure[data-media-id]').evaluateAll(figures => figures.map(figure => ({
    id:figure.dataset.mediaId,
    anchor:figure.querySelector('figcaption').id,
    label:figure.querySelector(`a[href="#${figure.dataset.mediaId}"]`)?.textContent,
    plate:figure.querySelector('.figure-plate')?.textContent,
  })));
  assert.deepEqual(placements.map(item=>item.id),specs.map(spec=>spec.id));
  assert.ok(placements.every(item=>item.id===item.anchor && item.id===item.label && (!item.plate || item.id===item.plate)));
  const numberOfPlates = specs.length - Object.keys(media).length;
  assert.equal(placements.filter(item=>item.plate).length,numberOfPlates);
  for (const spec of specs) {
    await visit(page,'zh',spec.id);
    assert.ok(await page.locator(`#${spec.id}`).evaluate(label=>label.getClientRects().length > 0));
  }
  await page.goto(`${url}?lang=zh#IMG-S05`);
  await placement.locator('.figure-plate a').click();
  assert.equal(new URL(page.url()).hash,'#IMG-S05');
  report.checks.push(`${placements.length} figure labels and Markdown links match; ${numberOfPlates} numbered frames contain only their IDs, and all direct links reveal their figures.`);
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
  assert.equal(await page.locator('#media-button-cad svg').count(),0);
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
  await visit(mobile,'zh','eng-evolution');
  assert.equal(await mobile.locator('[data-version]').count(),5);
  assert.ok(await mobile.locator('#scroller').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  for (const card of featuredCards) {
    await visit(mobile,'zh',card.id);
    assert.ok(await mobile.locator('#scroller').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  }
  await visit(mobile,'en','eng-current');
  assert.ok(await mobile.locator('.status-wrap').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  report.checks.push('390px layout smoke test: five version cards, four numbered decision frames and status table.');
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
