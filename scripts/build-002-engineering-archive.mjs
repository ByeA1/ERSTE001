import { readFile, writeFile } from 'node:fs/promises';
import { chapters, cases, media, structuralChanges } from '../content/erste002-engineering-visual.mjs';
import { stages, historicalChapters, threads } from '../content/erste002-engineering-history.mjs';
import { furtherEvidence, mediaSpecs, meshViews } from '../content/erste002-engineering-media-spec.mjs';

const repo = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('public/cases/erste002/engineering-assets.json', repo), 'utf8'));
const meshAudit = JSON.parse(await readFile(new URL('docs/erste002-engineering-visual-evidence/route-stl-audit.json', repo), 'utf8'));
const assetRoot = './assets/engineering/';
const usedSlots = [];
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const t = (zh, en, tag = 'span', attrs = '') => `<${tag}${attrs ? ' '+attrs : ''} data-zh="${escape(zh)}" data-en="${escape(en)}">${escape(zh)}</${tag}>`;
const localized = (pair, tag) => t(...pair, tag);
const aria = (zh, en) => `aria-label="${escape(zh)}" data-aria-zh="${escape(zh)}" data-aria-en="${escape(en)}"`;

function fileFor(slot) {
  const spec = mediaSpecs[slot];
  if (!spec) throw new Error(`Unmapped figure: ${slot}`);
  if (spec.version) {
    const source = meshAudit.packages.find(record=>record.version === spec.version);
    const image = source?.images.find(record=>record.view === spec.view);
    if (!image) throw new Error(`Missing audited mesh view: ${slot}`);
    return { ...image, provenance: `${source.source} · ${image.members.join(', ')}` };
  }
  const source = manifest.photos.find(record=>record.id === media[slot]?.source);
  if (!source) throw new Error(`Missing archived photo: ${slot}`);
  return { ...source.variants.at(-1), small: source.variants[0], provenance: source.source };
}

const pageUrl = 'http://127.0.0.1:5210/cases/erste002/engineering.html';

function figure(slot, visual, title, kind, options = {}) {
  const spec = mediaSpecs[slot];
  if (!spec) throw new Error(`Missing media spec: ${slot}`);
  usedSlots.push(slot);
  return `<figure class="archive-media ${options.className || ''}" id="media-${slot}" data-media-slot="${slot}" data-media-id="${spec.id}" data-media-kind="${kind}">
    ${visual}<figcaption id="${spec.id}"><a href="#${spec.id}">${spec.id}</a>${localized(title)}</figcaption>
  </figure>`;
}

function picture(slot, options = {}) {
  const spec = mediaSpecs[slot];
  const source = media[slot] || {};
  const asset = fileFor(slot);
  const kind = spec.version ? 'stl' : 'photo';
  const title = source.title || spec.caption;
  const label = source.version || meshViews[spec.view].label;
  const marks = source.marks?.map(([name,x,y])=>`<b class="photo-pin" style="--pin-x:${x}%;--pin-y:${y}%">${name}</b>`).join('') || '';
  const responsive = asset.small ? `srcset="${assetRoot}${asset.small.file} ${asset.small.width}w, ${assetRoot}${asset.file} ${asset.width}w" sizes="${source.sizes || '(max-width: 800px) 94vw, 50vw'}"` : '';
  const alt = title.map((caption,i)=>spec.version ? `${spec.version} / ${label[i]} / ${caption}` : caption);
  const framed = options.contain || spec.version;
  const visual = `<button type="button" class="image-open${framed ? ' framed-image' : ''}" style="--plate-ratio:${spec.ratio}" data-open-media data-full="${assetRoot}${asset.file}" ${aria('放大 '+alt[0], 'Enlarge '+alt[1])}>
    <img width="${asset.width}" height="${asset.height}" src="${assetRoot}${asset.file}" ${responsive} ${slot === 'cover' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${escape(alt[0])}" data-alt-zh="${escape(alt[0])}" data-alt-en="${escape(alt[1])}">
    ${spec.version ? `<span class="kind-label"><b>${spec.version}</b> · ${localized(label)}</span>` : `<span class="kind-label">${localized(label)}</span>`}
    ${marks ? `<span class="photo-pins" aria-hidden="true">${marks}</span>` : ''}<span class="zoom-mark" aria-hidden="true">↗</span></button>`;
  return figure(slot, visual, title, kind, options);
}

function sectionTitle(id, headline, lead) {
  const [, number, , name] = chapters.find(([key])=>key === id);
  return `<header class="chapter-title"><p class="section-kicker"><b>${number}</b>${name}</p><h2>${localized(headline)}</h2>${lead ? t(...lead,'p','class="chapter-lead"') : ''}</header>`;
}

const evidenceLabels = {
  observed: ['实物观察', 'Observed'], analysis: ['设计者判断', 'Analysis'], designed: ['设计已完成', 'Designed'], waiting: ['实体验证边界', 'Physical validation limits'],
};
function evidenceLabel(kind) {
  const [zh,en] = evidenceLabels[kind];
  const label = kind === 'waiting' ? 'NOT VALIDATED' : en.toUpperCase();
  return `<span class="evidence-label ${kind}" title="${zh} / ${en}"><i aria-hidden="true"></i>${label}</span>`;
}
function evidenceNotes(record) {
  const notes = ['observed','analysis'].filter(key=>record[key]);
  const title = record.observed ? ['实物观察与取舍','Observations and trade-offs'] : ['设计考虑','Design rationale'];
  return tray(title, `<div class="evidence-notes">${notes.map(key=>`<div>${evidenceLabel(key)}<p>${localized(record[key])}</p></div>`).join('')}</div>`);
}
function caseTitle(index) {
  const record = cases[index];
  return `<header class="case-title"><p class="section-kicker"><b>CASE 0${index+1}</b>${record.title}</p><h3>${localized(record.headline)}</h3><div class="case-lead">${evidenceLabel('designed')}<p>${localized(record.designed)}</p></div></header>`;
}
function tray(title, children) {
  return `<details class="study-tray"><summary>${localized(title)} <span aria-hidden="true">＋</span></summary>${children}</details>`;
}
const stageRail = stages.map(stage=>`<li><a href="#${stage.id}"><span class="step-index">${stage.version}</span><strong>${localized(stage.title)}</strong></a></li>`).join('');

function versionComparison() {
  return `<section class="version-comparison" id="eng-comparison" data-topic aria-labelledby="comparison-heading">
    <header class="comparison-heading"><div><p class="section-kicker">V1–V5 / STL COMPARISON</p><h2 id="comparison-heading">${t('五版结构对比','Five revisions side by side')}</h2></div>
    ${t('整体斜俯和内侧分别以同一正交机位、同一尺度渲染。','Each row uses one orthographic camera and scale across every revision.','p')}</header>
    <div class="version-grid">${stages.map(({ id, version, title })=>`<article class="version-card" data-version="${version}">
      <h3><a href="#${id}"><b>${version}</b>${localized(title)}<span aria-hidden="true">↗</span></a></h3>
      ${picture(`${version.toLowerCase()}-upper`)}${picture(`${version.toLowerCase()}-inside`)}
    </article>`).join('')}</div>
    ${t('斜俯与内视只显示该版本 STL 里的壳件。实物装配和性能观察见各版记录。','The renders show the shell parts present in each STL set. Physical assembly and performance observations are recorded separately.','p','class="scope-note"')}
  </section>`;
}

function historicalStudy(record) {
  return `<article class="history-study" id="${record.id}" data-topic>
    <header class="history-title"><p class="section-kicker">${record.kicker}</p><h3>${localized(record.heading)}</h3></header>
    ${record.figures ? `<div class="history-media">${record.figures.map(slot=>picture(slot, { contain: true })).join('')}</div>` : ''}
    <dl class="history-notes">${record.notes.map(([label,copy])=>`<div><dt>${localized(label)}</dt><dd>${localized(copy)}</dd></div>`).join('')}</dl>
    ${record.related?.map(([target,label])=>`<a class="related-figure" href="#${target}">${localized(label)} ↗</a>`).join('') || ''}
  </article>`;
}

function meshGallery(title, slots, className = '') {
  return `<aside class="geometry-shelf">
    <div><h3>${localized(title)}</h3>${t('STL 几何','STL geometry','p')}</div>
    <div class="history-media ${className}">${slots.map(slot=>picture(slot)).join('')}</div>
  </aside>`;
}

function historyChapter(record) {
  const [first, ...remaining] = record.studies;
  return `<section class="chapter history-chapter" id="${record.id}" data-chapter>
    ${sectionTitle(record.id,record.headline,record.lead)}
    ${historicalStudy(first)}
    ${record.gallery ? meshGallery(record.gallery.title, record.gallery.slots) : ''}
    ${remaining.map(historicalStudy).join('')}
  </section>`;
}

const evolutionThreads = `<section class="evolution-threads" id="eng-tracks" data-topic aria-labelledby="track-heading">
  <h3 id="track-heading">${t('按工程问题追溯','Trace a design problem')}</h3>
  ${threads.map(thread=>`<div class="evolution-thread"><h4>${localized(thread.title)}</h4><ol>${thread.links.map(([version,target,label])=>`<li><a href="#${target}"><b>${version}</b>${localized(label)}</a></li>`).join('')}</ol></div>`).join('')}
</section>`;

const body = `
<section class="overview chapter" data-chapter id="eng-overview">
  <div class="hero-grid"><div class="hero-copy">
    <p class="eyebrow">00 / ENGINEERING OVERVIEW</p>
    <h1>THE COST OF<br><em>LIGHTNESS.</em></h1>
    ${t('轻量化的结构代价','An open-base right-hand gaming mouse','h2')}
    ${t('一款无底壳右手鼠标，五版设计。通过实体制造和装配检验薄壁筋板的减料假设。','An open-base right-hand mouse in five design iterations. Physical builds tested the idea that thin walls and ribs could do more with less material.','p')}
    <div class="hero-links"><a class="hero-action" href="#eng-comparison">${t('比较 V1–V5','Compare V1–V5')} <span aria-hidden="true">↘</span></a><a class="hero-secondary" href="#eng-tracks">${t('按工程问题查看','Explore by design problem')} ↗</a></div>
  </div>${picture('cover', {className:'cover-image'})}</div>
  <ol class="step-rail" ${aria('设计版本','Design revisions')}>${stageRail}</ol>
</section>

${versionComparison()}

<section class="chapter form-chapter" data-chapter id="eng-form">
  <div class="form-gallery" id="eng-form-comparison" data-topic>
    <div class="form-intro">${sectionTitle('eng-form',['用薄壁筋板减料，先从试握开始。','A lighter shell began with the grip.'],['早期未分件 FDM 用于验证右手外形。V1 网格则展示了省去下壳、靠薄壁和筋板支撑的结构起点。','An early unsplit FDM sample helped shape the right-hand grip. The V1 mesh documents the structural starting point, with thin walls and ribs in place of a lower shell.'])}${picture('form-fdm')}</div>
    ${picture('form-generations')}
  </div>
  <section class="handling-study" id="eng-form-handling" data-topic aria-labelledby="handling-title">
    <div class="handling-pair">
      <header class="handling-title"><p class="section-kicker"><b>V1</b>TRIAL GRIP</p><h3 id="handling-title">${t('试握反馈促成一次改形。','Trial handling prompted one form revision.')}</h3>
      ${t('设计者在试握中关注指尖落点、掌心支撑和两侧曲面。','The designer checked where the fingertips landed, how the palm was supported and how each side fit.','p','class="chapter-lead"')}</header>
      ${picture('form-profile')}
    </div>
  </section>
  <p class="stage-transition" id="milestone-fdm">${t('外形确定后，下一步是给按键运动和内部固定建立独立接口。','Once the grip was set, the next build needed separate interfaces for button travel and internal mounts.')} <a href="#eng-evolution">${t('看 V2 分件与首轮 MJF','See the V2 part split and first MJF')} ↗</a></p>
</section>

${historicalChapters.map(historyChapter).join('')}

<section class="chapter decisions-chapter" data-chapter id="eng-decisions">
  <div id="milestone-cad" data-topic>
    ${sectionTitle('eng-decisions',['最后一轮重排支撑和机构。','The final revision reworked support and motion.'],['V5 修改集中在支撑、按键盖和电池装入路径。档案无同版实体或性能验证记录。','V5 revises support, the button cover and battery insertion. The archive has no documented V5 build or performance test.'])}
    ${t('最终未新增电池卡扣，未实施缝隙遮光。','The final design omits the proposed battery catch and gap light blocking.','p','class="scope-note" id="eng-final-scope" data-topic')}
  </div>
  ${evolutionThreads}
  <nav class="case-jumps" ${aria('工程专题','Engineering topics')}>${cases.map((record,i)=>`<a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↘</span></a>`).join('')}</nav>
  <article class="engineering-case" id="eng-case-stiffness" data-topic>${caseTitle(0)}
    <ol class="change-grid">${structuralChanges.map(([number,title,caption])=>`<li><b>${number}</b><div><strong>${localized(title)}</strong><span>${localized(caption)}</span></div></li>`).join('')}</ol>
    ${meshGallery(['V4 → V5 前部安装与支撑','V4 → V5 front mounts and support'],['v4-mounting','v5-mounting'])}
    <div class="case-extras">${evidenceNotes(cases[0])}</div>
  </article>
  <article class="engineering-case" id="eng-case-button" data-topic>${caseTitle(1)}
    ${meshGallery(['V2 → V5 按键盖内侧','V2 → V5 button cover undersides'],['v2-buttons','v3-buttons','v4-buttons','v5-buttons'],'button-mesh-grid')}
    <div class="case-extras">${evidenceNotes(cases[1])}</div>
  </article>
  <article class="engineering-case" id="eng-case-battery" data-topic>${caseTitle(2)}
    ${t('档案中的 STL 仅包含壳件。电池装入方向来自设计记录。','The STL archive contains shell parts. The battery insertion direction comes from the design record.','p','class="scope-note"')}
    <div class="case-extras">${evidenceNotes(cases[2])}</div>
  </article>
</section>

<section class="chapter current-chapter" data-chapter id="eng-current">
  <div class="conclusion-grid"><div>
    ${sectionTitle('eng-current',['整机刚度取决于承载路径的连续性。','Assembly stiffness depends on continuous load paths.'])}
    <div class="route-compared">
      <div>${t('开放底部', 'Open base', 'h3')}${t('后部筋板局部有效。前部开口与安装区切断传力路径，补上的跨接杆又与 PCB 争用空间。多轮样机反馈揭示了这套结构的整体刚度局限。','Rear ribs worked locally. Front openings and mounts interrupted load paths, and the added bridge competed with the PCB for space. Repeated builds exposed the stiffness limits of this architecture.','p')}</div>
      <div>${t('后续设计方向', 'Next design direction', 'h3')}${t('针对 ERSTE002 的几何与装配需求，设计者倾向传统上下壳。下壳可同时提供更连续的传力路径和安装基础。','For ERSTE002’s geometry and assembly needs, the designer favours a conventional upper and lower shell. The lower shell could provide a more continuous load path and a base for mounting components.','p')}</div>
    </div>
    ${t('这是基于样机反馈与结构分析的工程判断。两种方案尚无同条件的重量或刚度对照。','This judgement comes from prototype feedback and structural analysis. The two architectures were not tested for mass or stiffness under matched conditions.','p','class="scope-note"')}
  </div>${picture('front-openings', {contain: true})}</div>
  <div class="status-wrap"><table><thead><tr><th scope="col">${t('系统','System')}</th><th scope="col">${evidenceLabel('designed')}</th><th scope="col">${evidenceLabel('waiting')}</th></tr></thead><tbody>${cases.map((record,i)=>`<tr><th scope="row"><a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↗</span></a></th><td>${localized(record.state)}</td><td>${localized(record.validation)}</td></tr>`).join('')}</tbody></table></div>
  <div class="finish"><span>ERSTE002 / ENGINEERING ARCHIVE</span><a href="#eng-overview">${t('回到概览','Back to overview')} ↑</a></div>
</section>`;

if (Object.keys(mediaSpecs).sort().join('|') !== [...usedSlots].sort().join('|')) {
  throw new Error(`Media page and register must have the same figures.\nPage: ${usedSlots.join(', ')}`);
}
if (new Set(Object.values(mediaSpecs).map(({id})=>id)).size !== usedSlots.length) throw new Error('Duplicate media ID');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111213"><meta name="description" content="ERSTE002 ENGINEERING｜从薄壁筋板的减料假设到开放底部结构的工程复盘"><title>ERSTE002 / Engineering Archive</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./engineering-archive.css"></head>
<body>
<header class="archive-local-header" data-project-local-navigation><a href="/" data-project-close>ERSTE<span> / 002</span></a><span>ENGINEERING ARCHIVE</span><nav ${aria('语言','Language')}><button type="button" data-archive-language="zh" aria-pressed="true">中</button><span>/</span><button type="button" data-archive-language="en" aria-pressed="false">EN</button></nav></header>
<a class="skip-archive" href="#eng-overview">${t('跳至正文','Skip to content')}</a>
<nav class="archive-rail" ${aria('工程章节','Engineering chapters')}>${chapters.map(([id,number,name],i)=>`<a href="#${id}" data-section-link${i===0?' aria-current="location"':''}><span>${number}</span>${t(...name,'span','class="rail-label"')}</a>`).join('')}</nav>
<div id="scroller" tabindex="0" ${aria('ERSTE002 工程档案','ERSTE002 engineering archive')}><main id="engineering-archive">
${body}
</main></div>
<footer class="reading-progress"><span class="current-section"><b>00</b><span>${t('概览','Overview')}</span></span><div class="reading-track" aria-hidden="true"><span></span></div><output>000%</output><button type="button" data-chapter-prev ${aria('上一章','Previous chapter')} disabled>←</button><button type="button" data-chapter-next ${aria('下一章','Next chapter')}>→</button></footer>
<dialog class="media-dialog" aria-labelledby="media-dialog-title"><header><span id="media-dialog-title">ERSTE002 / ENGINEERING RECORD</span><button type="button" data-media-close>${t('关闭','Close')} ×</button></header><figure><img alt=""><figcaption></figcaption></figure><footer><button type="button" data-media-step="-1">← ${t('上一张','Previous')}</button><output></output><button type="button" data-media-step="1">${t('下一张','Next')} →</button></footer></dialog>
<script type="module" src="./engineering-archive.js"></script></body></html>
`;

const specDoc = [
  '# ERSTE002 ENGINEERING 最终图片与补充证据',
  '',
  '设计者于 2026 年 11 月 19 日确认，1.zip 至 5.zip 依次对应 V1 至 V5。正式工程渲染取自九个原始 STL。每类视图固定正交机位、比例和裁切，保留原始坐标和零件位置。局部图仅取景裁切，使用原网格。STL 坐标单位未声明，渲染用于读几何。',
  '',
  '同版实物照片用于记录外形和装配。性能结果以样机记录或量测为准。档案中的网格只包含壳体和按键盖，PCB、电池、微动及装配运动由实物或装配资料补充。',
  '',
  '## 页面图片',
  '',
  '| 图号 | 类型与用途 | 正式展示文件 | 来源 |',
  '| --- | --- | --- | --- |',
  ...usedSlots.map(slot => {
    const spec = mediaSpecs[slot];
    const asset = fileFor(slot);
    const purpose = spec.version ? 'STL 正式工程渲染 · ' + meshViews[spec.view].label[0] + '。' + spec.caption[0] : '档案实拍 · ' + spec.section + '。' + spec.purpose;
    return '| [' + spec.id + '](' + pageUrl + '#' + spec.id + ') | ' + purpose + ' | `' + asset.file + '` | `' + asset.provenance + '` |';
  }),
  '',
  '工程图生成记录含镜头参数、裁切、ZIP 和原始成员哈希。 [网格核验记录](erste002-engineering-visual-evidence/route-stl-audit.json)',
  '',
  '## 需补充的验证资料',
  '',
  '| 版本 | 证据 | 采集方法 | 用途 |',
  '| --- | --- | --- | --- |',
  ...furtherEvidence.map(row => '| ' + row.join(' | ') + ' |'),
  '',
  '摄影使用固定机位、哑灰底和柔和侧光；过程拍摄保留原帧与样件身份。CAD 对照提供各状态同尺度、同剖切位置的原 PNG，建议宽度至少 1400 px。工程事件归属与证据分类见[内部追溯表](ERSTE002-engineering-traceability.md)。',
];


await writeFile(new URL('public/cases/erste002/engineering.html', repo), html.replace(/[\t ]+$/gm, ''));
await writeFile(new URL('docs/ERSTE002-engineering-final-media-spec.md', repo), specDoc.join('\n')+'\n');
console.log(`Generated ${chapters.length} chapters, ${cases.length} decisions and ${usedSlots.length} media specs.`);
