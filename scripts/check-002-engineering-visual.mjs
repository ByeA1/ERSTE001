import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chapters, cases } from '../content/erste002-engineering-visual.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';
import { historicalChapters, stages, threads } from '../content/erste002-engineering-history.mjs';

const { chromium } = createRequire(import.meta.url)('../.audit/model-logo/tools/node_modules/playwright');
const url = (process.env.ERSTE_ORIGIN || 'http://127.0.0.1:5210') + '/cases/erste002/engineering.html';
const out = process.env.ERSTE_EVIDENCE || '.audit/erste002-engineering-visual';
await mkdir(out, { recursive: true });
const specs = Object.values(mediaSpecs);
const versions = stages.map(stage=>stage.version);
const doc = await readFile('docs/ERSTE002-engineering-final-media-spec.md','utf8');
const ids = [...doc.matchAll(/\[(IMG-[A-Z0-9-]+)\]\([^\n]+engineering\.html#\1\)/g)].map(match=>match[1]);
assert.deepEqual([...ids].sort(),specs.map(spec=>spec.id).sort());
const trace = await readFile('docs/ERSTE002-engineering-traceability.md','utf8');
const traceIds = [...trace.matchAll(/\bIMG-[A-Z0-9-]+/g)].map(match=>match[0]);
assert.ok(traceIds.every(id=>ids.includes(id)));

const audit = JSON.parse(await readFile('docs/erste002-engineering-visual-evidence/route-stl-audit.json','utf8'));
assert.deepEqual(audit.packages.map(record=>record.version),versions);
assert.equal(audit.packages.flatMap(record=>record.members).length,9);
const stl = audit.packages.flatMap(record=>record.images);
assert.equal(stl.length,18);
for (const record of stl) {
  const bytes = await readFile(join('public/cases/erste002/assets/engineering',record.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,record.file);
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { preview: url, browser: browser.version(), checks: [], screenshots: [], errors: [] };
const targets = [
  'eng-overview','eng-comparison','eng-form','eng-evolution','eng-support','eng-built',
  'eng-case-stiffness','eng-case-button','eng-case-battery','eng-current',
];
const centerTarget = async (page, id) => page.waitForFunction(id=>{
  const scroller = document.getElementById('scroller');
  const target = document.getElementById(id);
  const viewport = scroller.getBoundingClientRect();
  const y = (target.matches('figcaption') ? target.closest('figure') : target).getBoundingClientRect().top;
  const atEnd = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1;
  return y >= viewport.top - 1 && y < (atEnd ? viewport.bottom : viewport.top + viewport.height / 2);
},id);

async function visit(page, lang, id) {
  const response = await page.goto(`${url}?lang=${lang}#${id}`);
  assert.ok(!response || response.ok());
  await page.waitForFunction(language=>document.documentElement.lang.startsWith(language) && document.body.dataset.archiveSection,lang);
  await centerTarget(page,id);
}

async function capture(page, label) {
  await page.evaluate(async ()=>{
    const scroller = document.getElementById('scroller').getBoundingClientRect();
    const visible = [...document.querySelectorAll('main img')].filter(image=>{
      const box = image.getBoundingClientRect();
      return box.bottom > scroller.top && box.top < scroller.bottom;
    });
    await Promise.all(visible.map(image=>image.decode()));
  });
  await page.screenshot({path:join(out,label),type:'jpeg',quality:89});
  report.screenshots.push(label);
}

async function openPage(viewport, mobile = false) {
  const page = await browser.newPage({ viewport, reducedMotion:'reduce', serviceWorkers:'block', isMobile:mobile, hasTouch:mobile });
  page.on('pageerror', error=>report.errors.push(error.message));
  page.on('requestfailed', request=>{
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) report.errors.push(request.url());
  });
  return page;
}

try {
  for (const [width,height,lang] of [[1920,1080,'zh'],[1440,900,'en']]) {
    const page = await openPage({width,height});
    const productRuntime = [];
    page.on('request', request=>{
      if (/\.glb\b|three\.module|story-(app|engine)/i.test(request.url())) productRuntime.push(request.url());
    });
    for (const id of targets) {
      await visit(page,lang,id);
      assert.ok(await page.locator('#scroller').evaluate(el=>el.scrollWidth <= el.clientWidth + 1 && window.scrollY === 0));
      await capture(page,`${width}-${lang}-${id.slice(4)}.jpg`);
    }
    assert.deepEqual(await page.locator('.step-rail .step-index').allTextContents(),versions);
    assert.deepEqual(await page.locator('[data-section-link] > span:first-child').allTextContents(),chapters.map(chapter=>chapter[1]));
    assert.equal(await page.locator('.engineering-case').count(),cases.length);
    assert.equal(await page.locator('.history-study').count(),historicalChapters.flatMap(chapter=>chapter.studies).length);
    assert.equal(await page.locator('.figure-plate,[data-media-kind="plate"],.material-card').count(),0);
    assert.equal(await page.locator('figure[data-media-kind="stl"]').count(),18);
    assert.deepEqual(await page.locator('figure[data-media-id] figcaption').evaluateAll(nodes=>nodes.map(node=>node.id)),ids);
    assert.doesNotMatch(await page.locator('main').innerText(),/收件包|package [0-9]|\b[A-E][1-3] \/|unassigned|临时占位/i);
    assert.match(await page.locator('#eng-current').innerText(),lang === 'zh' ? /倾向传统上下壳/ : /favours a conventional upper and lower shell/);
    assert.match(await page.locator('#eng-decisions').innerText(),lang === 'zh' ? /无同版实体或性能验证记录/ : /no documented V5 build or performance test/);
    for (const gallery of ['.version-card figure:first-of-type','.version-card figure:last-of-type','#eng-case-button figure','#eng-case-stiffness figure']) {
      const boxes = await page.locator(gallery+' img').evaluateAll(images=>images.map(image=>image.getBoundingClientRect().toJSON()));
      assert.ok(boxes.length > 1 && boxes.every(box=>box.y === boxes[0].y && Math.abs(box.width - boxes[0].width) < 1),gallery);
    }
    for (const id of ids) {
      const figure = page.locator(`figure[data-media-id="${id}"]`);
      await figure.scrollIntoViewIfNeeded();
      await figure.locator('img').evaluate(image=>image.decode());
    }
    assert.deepEqual(productRuntime,[]);
    report.checks.push(`${width} × ${height} ${lang}: all ${ids.length} figures decoded, five revisions and matched rows verified. No overflow, empty frames or product runtime.`);
    await page.close();
  }

  const page = await openPage({width:1440,height:900});
  for (const id of ids) await visit(page,'zh',id);
  for (const thread of threads) {
    for (const [,target,[label]] of thread.links) {
      await visit(page,'zh','eng-tracks');
      await page.locator(`#eng-tracks a[href="#${target}"]`).filter({hasText:label}).click();
      await centerTarget(page,target);
    }
  }
  await visit(page,'zh','eng-overview');
  await page.locator('.hero-action').click();
  await centerTarget(page,'eng-comparison');
  const opener = page.locator('#media-v1-upper button');
  await opener.click();
  assert.equal(await page.locator('.media-dialog').getAttribute('data-media-slot'),'v1-upper');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.media-dialog').getAttribute('data-media-slot'),'v1-inside');
  await page.keyboard.press('Escape');
  assert.ok(await opener.evaluate(button=>document.activeElement === button));
  await page.locator('.version-card[data-version="V3"] h3 a').click();
  await page.waitForFunction(()=>document.body.dataset.archiveSection === 'eng-support');
  await page.goBack();
  await centerTarget(page,'eng-comparison');
  await page.goForward();
  await centerTarget(page,'eng-support');
  await page.locator('[data-archive-language=en]').click();
  await page.waitForFunction(()=>document.documentElement.lang === 'en');
  await page.reload();
  await centerTarget(page,'eng-support');
  await page.goto(`${url}?lang=en#IMG-H12`);
  await centerTarget(page,'IMG-V5-IN');
  await page.close();
  report.checks.push(`${ids.length} figure links, 12 cross-version engineering links, compare CTA, zoom, focus, browser history, locale switch and one legacy hash passed.`);

  const phone = await openPage({width:390,height:844},true);
  await visit(phone,'zh','eng-comparison');
  assert.equal(await phone.locator('.version-card').count(),5);
  assert.ok(await phone.locator('#scroller').evaluate(el=>el.scrollWidth <= el.clientWidth + 1));
  await capture(phone,'390-zh-comparison.jpg');
  await phone.close();
  report.checks.push('390 px comparison smoke test passed.');
  assert.deepEqual(report.errors,[]);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failure = error.stack;
  throw error;
} finally {
  await writeFile(join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
console.log(JSON.stringify(report,null,2));
