import { readFile, writeFile } from 'node:fs/promises';
import { chapters, cases, steps, media, structuralChanges } from '../content/erste002-engineering-visual.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';
import { diagrams } from './erste002-engineering-diagrams.mjs';

const repo = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('public/cases/erste002/engineering-assets.json', repo), 'utf8'));
const assetRoot = './assets/engineering/';
const usedSlots = [];
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const t = (zh, en, tag = 'span', attrs = '') => `<${tag}${attrs ? ' '+attrs : ''} data-zh="${escape(zh)}" data-en="${escape(en)}">${escape(zh)}</${tag}>`;
const localized = (pair, tag) => t(...pair, tag);
const aria = (zh, en) => `aria-label="${escape(zh)}" data-aria-zh="${escape(zh)}" data-aria-en="${escape(en)}"`;

function fileFor(slot) {
  const asset = media[slot];
  if (!asset) return null;
  if (asset.file) return { file: asset.file, width: asset.width, height: asset.height, provenance: asset.provenance };
  const source = [...manifest.photos, ...manifest.cad].find((record) => record.id === asset.source);
  if (!source) throw new Error(`Unmapped image: ${asset.source}`);
  return source.variants
    ? { ...source.variants.at(-1), small: source.variants[0], provenance: source.source }
    : { file: source.file, width: 1200, height: 900, provenance: source.source };
}

const schematicSlots = new Set(['support-diagram', 'button-diagram', 'battery-diagram', 'light-diagram']);
const materialStatus = (slot) => media[slot] || schematicSlots.has(slot)
  ? ['临时占位', 'Temporary'] : ['待制作', 'Awaiting production'];
const specUrl = 'http://127.0.0.1:5208/cases/erste002/engineering.html?media=1';

function materialChapter(code) {
  const [part, topic] = code.split('.');
  const [, , label] = chapters.find(([,number]) => number === part);
  return label.map((name, i) => `${code} / ${name}${topic ? ` · ${cases[Number(topic) - 1].short[i]}` : ''}`);
}

function specCard(slot) {
  const spec = mediaSpecs[slot];
  const asset = fileFor(slot);
  const fields = [
    [['所属章节', 'Chapter / topic'], materialChapter(spec.chapter)],
    [['类型 / 制作', 'Type / production'], spec.type.map((value, i) => `${value} / ${spec.production[i]}`)],
    [['版本', 'Version'], spec.version], [['对象', 'Subject'], spec.object], [['视角', 'Camera'], spec.view],
    [['必须可见', 'Must show'], spec.details], [['建议标注', 'Annotations'], spec.marks], [['布置', 'Setup'], spec.setup],
    [['比例 / 展示宽度', 'Ratio / display width'], [`${spec.ratio} · PC 约 ${spec.width} px`, `${spec.ratio} · about ${spec.width} px on desktop`]],
    [['用途', 'Purpose'], spec.purpose],
    [['当前占位', 'Temporary source'], asset ? [asset.file, asset.file] : schematicSlots.has(slot) ? ['页面线图 · 功能示意', 'Inline functional sketch'] : ['无', 'None']],
  ];
  if (spec.review) fields.push([['现有素材评估', 'Temporary media review'], spec.review]);
  return `<details class="material-card" id="${spec.id}" data-production><summary><span>${spec.id} / ${spec.priority}</span> ${t('最终素材要求','Final media spec')} <span class="material-state">${localized(materialStatus(slot))}</span></summary><dl>${fields.map(([label,value])=>`<div><dt>${localized(label)}</dt><dd>${localized(value)}</dd></div>`).join('')}</dl></details>`;
}

function figure(slot, visual, title, caption, kind, options = {}) {
  const spec = mediaSpecs[slot];
  if (!spec) throw new Error(`Missing media spec: ${slot}`);
  usedSlots.push(slot);
  return `<figure class="archive-media ${options.className || ''}" id="media-${slot}" data-media-slot="${slot}" data-media-id="${spec.id}" data-media-kind="${kind}" style="--spec-width:${spec.width}px"${options.authorOnly ? ' data-production' : ''}>
    ${visual}<figcaption><div class="caption-meta"><span>${spec.id}</span>${localized(caption)}</div><strong>${localized(title)}</strong></figcaption>${specCard(slot)}
  </figure>`;
}

function photo(slot, options = {}) {
  const source = media[slot];
  const asset = fileFor(slot);
  const kind = source.kind || 'photo';
  const versions = kind === 'cad' ? ['CAD / 历史网格', 'CAD / HISTORICAL MESH'] : ['实物', 'PHYSICAL'];
  const marks = source.marks?.map(([name,x,y])=>`<b class="photo-pin" style="--pin-x:${x}%;--pin-y:${y}%">${name}</b>`).join('') || '';
  const trace = source.trace ? `<svg class="geometry-trace" viewBox="0 0 ${asset.width} ${asset.height}" preserveAspectRatio="none" aria-hidden="true"><path d="${source.trace}"/></svg>` : '';
  const responsive = asset.small ? `srcset="${assetRoot}${asset.small.file} ${asset.small.width}w, ${assetRoot}${asset.file} ${asset.width}w" sizes="${source.sizes || '(max-width: 800px) 94vw, 50vw'}"` : '';
  const visual = `<button type="button" class="image-open${marks ? ' has-pins' : ''}" data-open-media data-full="${assetRoot}${asset.file}" ${aria('放大：'+source.title[0], 'Enlarge: '+source.title[1])}>
    <img width="${asset.width}" height="${asset.height}" src="${assetRoot}${asset.file}" ${responsive} ${slot === 'cover' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${escape(source.title[0])}" data-alt-zh="${escape(source.title[0])}" data-alt-en="${escape(source.title[1])}">
    ${trace}<span class="kind-label">${localized(versions)}</span><span class="photo-pins" aria-hidden="true">${marks}</span><span class="zoom-mark" aria-hidden="true">↗</span></button>`;
  return figure(slot, visual, source.title, source.version, kind, options);
}

function missing(slot, { authorOnly = false } = {}) {
  const spec = mediaSpecs[slot];
  const visual = `<div class="reserved-frame" style="--reserved-ratio:${spec.ratio.replace(':',' / ')}"><span class="frame-corner" aria-hidden="true"></span><span class="kind-label">${localized(spec.type)}</span><b>${localized(spec.object)}</b><small>${t('图像未收录','Image unavailable')}</small></div>`;
  return figure(slot, visual, spec.object, spec.version, 'missing', { authorOnly });
}

function diagram(slot, title, structure, detail) {
  return figure(slot, `<div class="diagram-sheet" ${aria(...title)} role="group">${structure}</div>`, detail, ['功能图解 · 非实际几何', 'Functional diagram · illustrative geometry'], 'diagram');
}

function sectionTitle(index, headline, lead) {
  const [, number, , name] = chapters[index];
  return `<header class="chapter-title"><div class="chapter-number">${number}</div><div><p class="eyebrow">${name}</p><h2>${localized(headline)}</h2></div>${lead ? localized(lead,'p') : ''}</header>`;
}

const evidenceLabels = {
  observed: ['实物观察', 'Observed'], analysis: ['设计者判断', 'Analysis'], designed: ['设计已完成', 'Designed'], waiting: ['尚无对应实测', 'Not validated'],
};
function evidenceLabel(kind) {
  const [zh,en] = evidenceLabels[kind];
  const label = kind === 'waiting' ? 'NOT VALIDATED' : en.toUpperCase();
  return `<span class="evidence-label ${kind}" title="${zh} / ${en}"><i aria-hidden="true"></i>${label}</span>`;
}
function evidenceRows(record) {
  return `<div class="evidence-strip">${['observed','analysis','designed'].filter((key)=>record[key]).map((key)=>`<div>${evidenceLabel(key)}<p>${localized(record[key])}</p></div>`).join('')}</div>`;
}
function caseTitle(index) {
  const record = cases[index];
  return `<header class="case-title"><span class="case-counter">CASE 0${index+1}</span><div><p class="eyebrow">${record.title}</p><h3>${localized(record.headline)}</h3></div></header>`;
}
function tray(title, children, authorOnly = false) {
  return `<details class="study-tray"${authorOnly ? ' data-production' : ''}><summary>${localized(title)} <span aria-hidden="true">＋</span></summary>${children}</details>`;
}
const missingGroup = (...slots) => `<div class="placeholder-grid">${slots.map(slot=>missing(slot)).join('')}</div>`;
const authorTray = (...slots) => tray(['补充图位 · 最终素材卡','Additional placements / final media specs'], missingGroup(...slots), true);
const drawings = diagrams({t, diagram});

const stepRail = steps.map((step, i)=>`<li><a href="#milestone-${step.id}"><span class="step-index">0${i+1} / ${step.stage}</span><strong>${localized(step.name)}</strong><span class="step-summary">${localized(step.summary)}</span></a></li>`).join('');

const body = `
<section class="overview chapter" data-chapter id="eng-overview">
  <div class="hero-grid"><div class="hero-copy">
    <p class="eyebrow">00 / ENGINEERING OVERVIEW</p>
    <h1>THE COST OF<br><em>LIGHTNESS.</em></h1>
    ${t('轻量化的结构代价','An open-base right-hand gaming mouse','h2')}
    ${t('无底壳的右手工学鼠标。从手感样件到四项工程设计修改。','From the grip mock-up to four mechanical design decisions.','p')}
    <nav class="hero-cases" ${aria('工程专题','Engineering topics')}>${cases.map(record=>`<a href="#eng-case-${record.id}">${localized(record.short)}</a>`).join('')}</nav>
    <a class="hero-action" href="#eng-current">${t('查看当前设计状态','See current design status')} <span aria-hidden="true">↗</span></a>
  </div>${photo('cover', {className:'cover-image'})}</div>
  <ol class="step-rail" ${aria('五个工程里程碑','Five engineering milestones')}>${stepRail}</ol>
</section>

<section class="chapter form-chapter" data-chapter id="eng-form">
  ${sectionTitle(1,['先确定手里的曲面。','Find the shape in the hand.'],['一次实际试握后的改形，定下右手非对称曲面。','One revision after hands-on feedback established the direction for the asymmetric right-hand form.'])}
  <div class="form-gallery" id="eng-form-comparison" data-topic>${photo('form-fdm')}${photo('form-generations')}</div>
  <div class="profile-row" id="eng-form-handling" data-topic>${photo('form-profile')}
    <div class="grip-note"><p class="eyebrow">HANDLING INPUT</p><h3>${t('指尖落点与掌心支撑。','Fingertip landing and palm support.')}</h3>${t('握持反馈用于改形；现存 FDM 样件的改形前后归属未细分。','Handling informed the revision. The archived FDM sample is not assigned to the before or after stage.','p')}</div>
    ${missing('grip',{authorOnly:true})}${missing('matched-form',{authorOnly:true})}
  </div>
</section>

<section class="chapter evolution-chapter" data-chapter id="eng-evolution">
  ${sectionTitle(2,['五个工程里程碑。','Five engineering milestones.'],['阶段顺序来自设计记录。历史照片和 STL 不能逐一对应打印轮次。','The design record establishes the stages. Photographs and STL packages do not map one-to-one to print rounds.'])}
  <ol class="milestone-grid" id="milestones">${steps.map((step,i)=>{
    const image = step.image ? photo(step.image) : missing(step.id === 'mjf' ? 'first-mjf' : 'evo-cad');
    return `<li id="milestone-${step.id}" data-topic><div class="milestone-heading"><span>0${i+1} / ${step.stage}</span><h3>${localized(step.name)}</h3></div>${image}<dl>${[[['做了什么','Built'],step.action],[['发现','Found'],step.finding],[['下一步','Next'],step.next]].map(([label,value])=>`<div><dt>${localized(label)}</dt><dd>${localized(value)}</dd></div>`).join('')}</dl></li>`;
  }).join('')}</ol>
  ${authorTray('interference')}
</section>

<section class="chapter decisions-chapter" data-chapter id="eng-decisions">
  ${sectionTitle(3,['四个工程决策。','Four engineering decisions.'])}
  <nav class="case-jumps" ${aria('工程专题','Engineering topics')}>${cases.map((record,i)=>`<a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↘</span></a>`).join('')}</nav>
  <div class="evidence-legend" ${aria('工程证据图例','Engineering evidence legend')}>${Object.entries(evidenceLabels).map(([kind,[zh,en]])=>`<span>${evidenceLabel(kind)}${t(zh,en)}</span>`).join('')}<span class="line-legend"><i></i>${t('支撑 / 作用方向','Support / action')}</span><span class="line-legend dashed"><i></i>${t('装配 / 运动','Assembly / travel')}</span></div>
  <article class="engineering-case" id="eng-case-stiffness" data-topic>${caseTitle(0)}${evidenceRows(cases[0])}
    <div class="case-split">${photo('stiffness-photo')}${drawings.support()}</div>
    <div class="photo-key">${t('A 筋板　 B 跨接杆　 C 安装柱','A Ribs · B Spanning rod · C Mounting posts')}</div>
    <ol class="change-grid">${structuralChanges.map(([number,title,caption])=>`<li><b>${number}</b><div><strong>${localized(title)}</strong><span>${localized(caption)}</span></div></li>`).join('')}</ol>
    ${authorTray('stiffness-compare','functional-fold','base-section','main-joint')}
    ${tray(['对照历史 CAD 几何','Compare historical CAD geometry'],`<div class="case-split cad-pair">${photo('cad-p01')}${photo('cad-p04')}</div>${t('同机位查看归档 STL。收件包号不是 REV，不能用于判断强度。','Matched views of archived STL meshes. Package IDs do not establish revision or strength.','p','class="small-note"')}`)}
    ${authorTray('stiffness-load')}
  </article>
  <article class="engineering-case" id="eng-case-button" data-topic>${caseTitle(1)}${evidenceRows(cases[1])}
    ${drawings.button()}
    ${tray(['查看按键盖历史几何','Inspect historical button-cover geometry'],`<div class="case-split">${photo('button-cad')}${missing('button-new',{authorOnly:true})}</div>${t('按实际网格预览描边。A 盖体片体，B 后部连接。M007 尚未与异常按压样机对应。','Outline traced from the historical mesh view. A cover panel, B rear connection. M007 is not matched to the observed failure.','p','class="small-note"')}`)}
    ${authorTray('button-edge','button-thickness','button-motion','button-observed')}
  </article>
  <article class="engineering-case" id="eng-case-battery" data-topic>${caseTitle(2)}${evidenceRows(cases[2])}
    ${drawings.battery()}${authorTray('battery-catch','battery-old')}
  </article>
  <article class="engineering-case light-case" id="eng-case-light" data-topic>${caseTitle(3)}
    <div class="light-split">${evidenceRows(cases[3])}${drawings.light()}</div>${authorTray('light-section')}
  </article>
</section>

<section class="chapter current-chapter" data-chapter id="eng-current">
  ${sectionTitle(4,['设计已改，实物待复核。','Design revised. Physical checks pending.'])}
  <div class="status-intro"><span class="cad-status">${t('当前 CAD / 设计完成','CURRENT CAD / DESIGN COMPLETE')}</span>${t('最近实物是红滚轮装配版。下表记录其后的设计修改。','The red-wheel build is the latest physical prototype. The table covers the subsequent CAD changes.')}</div>
  <div class="status-wrap"><table><thead><tr><th scope="col">${t('系统','System')}</th><th scope="col">${evidenceLabel('designed')}</th><th scope="col">${evidenceLabel('waiting')}</th></tr></thead><tbody>${cases.map((record,i)=>`<tr><th scope="row"><a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↗</span></a></th><td>${localized(record.state)}</td><td>${localized(record.validation)}</td></tr>`).join('')}</tbody></table></div>
  ${authorTray('current-overview','validation')}
  <div class="finish"><span>ERSTE002 / ENGINEERING ARCHIVE</span><a href="#eng-overview">${t('回到概览','Back to overview')} ↑</a></div>
</section>`;

if (Object.keys(mediaSpecs).join('|') !== usedSlots.join('|')) {
  throw new Error(`Media pages and production register must match in order.\nPage: ${usedSlots.join(', ')}`);
}
if (new Set(Object.values(mediaSpecs).map(({id})=>id)).size !== usedSlots.length) throw new Error('Duplicate media ID');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111213"><meta name="description" content="ERSTE002 ENGINEERING｜外形、实物迭代、工程决策与当前设计"><title>ERSTE002 / Engineering Archive</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./engineering-archive.css"></head>
<body>
<header class="archive-local-header" data-project-local-navigation><a href="/" data-project-close>ERSTE<span> / 002</span></a><span>ENGINEERING ARCHIVE</span><nav ${aria('语言','Language')}><button type="button" data-archive-language="zh" aria-pressed="true">中</button><span>/</span><button type="button" data-archive-language="en" aria-pressed="false">EN</button></nav></header>
<a class="skip-archive" href="#eng-overview">${t('跳至正文','Skip to content')}</a>
<nav class="archive-rail" ${aria('工程章节','Engineering chapters')}>${chapters.map(([id,number,name],i)=>`<a href="#${id}" data-section-link${i===0?' aria-current="location"':''}><span>${number}</span>${t(...name,'span','class="rail-label"')}</a>`).join('')}</nav>
<div id="scroller" tabindex="0" ${aria('ERSTE002 工程档案','ERSTE002 engineering archive')}><main id="engineering-archive">
<aside class="author-mode" data-production><span>MEDIA SPEC / ${usedSlots.length}</span>${t('展开各图下方的最终素材要求。','Expand the final media spec below each visual.')} <a href="./engineering.html">${t('访客模式','Visitor view')} ↗</a></aside>
${body}
</main></div>
<footer class="reading-progress"><span class="current-section"><b>00</b><span>${t('概览','Overview')}</span></span><div class="reading-track" aria-hidden="true"><span></span></div><output>000%</output><button type="button" data-chapter-prev ${aria('上一章','Previous chapter')} disabled>←</button><button type="button" data-chapter-next ${aria('下一章','Next chapter')}>→</button></footer>
<dialog class="media-dialog" aria-labelledby="media-dialog-title"><header><span id="media-dialog-title">ERSTE002 / ENGINEERING RECORD</span><button type="button" data-media-close>${t('关闭','Close')} ×</button></header><figure><img alt=""><figcaption></figcaption></figure><footer><button type="button" data-media-step="-1">← ${t('上一张','Previous')}</button><output></output><button type="button" data-media-step="1">${t('下一张','Next')} →</button></footer></dialog>
<script type="module" src="./engineering-archive.js"></script></body></html>
`;

const specDoc = [
  '# ERSTE002 ENGINEERING 最终图片素材规格',
  '',
  '访客页中的档案照片、STL 预览和功能线图均是临时排版素材。本清单列出每个图位的独立验收要求。当前无图的位置标为待制作。',
  '',
  '网页素材模式：`/cases/erste002/engineering.html?media=1`。图下素材卡与本文件使用相同编号。P0 为新版核心结构与图解，P1 为主叙事及关键历史证据，P2 为补充对照。',
  '素材状态分为待制作、临时占位、最终素材已提供和已验收。拿到符合对应版本的成品可标为已提供。核对版本、机位、必见细节及展示尺寸后才标为已验收。',
  '',
  '## 最简执行清单',
  '',
  '1. 摄影一次台面布景。哑灰背景、柔和顶侧光、固定白平衡及焦距，拍红滚轮装配版三分之四低视角和正前偏侧（O01、P04）。同场拍 FDM 斜俯、正俯、侧视、握持和三件同朝向合照（F01–F04、P01）。握持补拍标明重现。F05 仅在两件改形样件身份都能核实时拍。',
  '2. 历史零件另成一组。核对首轮 MJF、加杆版、红滚轮版裸上盖的身份。以同一光线拍分件摊开、孔位近景、底部内视（P02、P03、S01）。能追溯时再补 PCB 干涉、按压、电池松动和整体偏软的过程证据（P06、K07、B03、S09）。',
  '3. NX 总装先完成 P05、C01。当前 CAD 保存三分之四总装视图和底部内视。同一组截图供两个图位使用，P05 裁成节点图，C01 保留全景及四处标注。统一背景、投影、缩放与坐标轴，保留文件版本。',
  '4. NX 结构一次截取 S02–S06。前后版锁同一正交相机。先截整壳底视及前杆，再截功能片体、开口边缘法向剖面、主杆与上盖接点。S07–S08 单独用经核实的历史文件复现，不用新版代替。',
  '5. NX 按键一次截取 K01–K06。前后版同机位内侧轴测，并在同位置纵切捕捉连接、厚薄和弯折分区。保留微动位置及限位，画施力和预期运动箭头；如某项不存在，用标注说明。',
  '6. NX 电池和遮光分别截 B01–B02、L01–L02。电池保持固定侧剖面拍装入前、路径、到位，另截图卡口。遮光局部同剖面抓静止与按下两状态，标光路及剩余间隙。L01 图解从 L02 取所需截面，复用同一组 NX 视图。',
  '7. 按图号交付。实拍保留原图，NX 提供无标注 PNG。标注副本可选，文件名示例为 `IMG-S05_before.png`、`IMG-S05_after.png`、`IMG-S05_after_annotated.png`。每组附简短的文件版本或样件身份及视图说明。按下方比例留裁切边距，推荐原稿宽度为桌面展示宽度的两倍。C02 等对应实物测试完成后再补。',
  '',
  '## 逐图制作卡',
];

for (const slot of usedSlots) {
  const row = mediaSpecs[slot];
  const source = fileFor(slot);
  specDoc.push('', `### ${row.id}｜${row.object[0]}`, '',
    `- 章节及优先级：${materialChapter(row.chapter)[0]} / ${row.priority}`,
    `- 图片类型及制作：${row.type[0]} / ${row.production[0]}`,
    `- 对应版本：${row.version[0]}`,
    `- 对象与视角：${row.object[0]}。${row.view[0]}。`,
    `- 必须可见：${row.details[0]}。`,
    `- 建议标注：${row.marks[0]}`,
    `- 布置：${row.setup[0]}`,
    `- 比例与展示尺寸：${row.ratio}，PC 最大约 ${row.width} CSS px 宽。像素原稿建议 ≥ ${row.width * 2} px 宽。`,
    `- 用途：${row.purpose[0]}。`,
    `- 当前占位：${source ? `\`public/cases/erste002/assets/engineering/${source.file}\`，来源 \`${source.provenance}\`` : schematicSlots.has(slot) ? '页面内联功能图解，待以对应版本几何核对或制图。' : '无。'}`,
    ...(row.review ? [`- 现有素材评估：${row.review[0]}`] : []),
    `- 素材状态：${materialStatus(slot)[0]}。`,
    `- [在页面图位打开 ${row.id} 制作卡](${specUrl}#${row.id})`);
}

await writeFile(new URL('public/cases/erste002/engineering.html', repo), html.replace(/[\t ]+$/gm, ''));
await writeFile(new URL('docs/ERSTE002-engineering-final-media-spec.md', repo), specDoc.join('\n')+'\n');
console.log(`Generated ${chapters.length} chapters, ${cases.length} decisions and ${usedSlots.length} media specs.`);
