import { readFile, writeFile } from 'node:fs/promises';
import { chapters, cases, media, structuralChanges } from '../content/erste002-engineering-visual.mjs';
import { stages, historicalChapters, threads } from '../content/erste002-engineering-history.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';

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

const pageUrl = 'http://127.0.0.1:5210/cases/erste002/engineering.html';

function materialChapter(code) {
  const [part, topic] = code.split('.');
  const [, , label] = chapters.find(([,number]) => number === part);
  return label.map((name, i) => `${code} / ${name}${topic ? ` · ${cases[Number(topic) - 1].short[i]}` : ''}`);
}

function figure(slot, visual, title, kind, options = {}) {
  const spec = mediaSpecs[slot];
  if (!spec) throw new Error(`Missing media spec: ${slot}`);
  usedSlots.push(slot);
  return `<figure class="archive-media ${options.className || ''}" id="media-${slot}" data-media-slot="${slot}" data-media-id="${spec.id}" data-media-kind="${kind}">
    ${visual}<figcaption id="${spec.id}">${kind === 'plate' ? '' : `<a href="#${spec.id}">${spec.id}</a>`}${localized(title)}</figcaption>
  </figure>`;
}

function photo(slot, options = {}) {
  const source = media[slot];
  const asset = fileFor(slot);
  const kind = source.kind || 'photo';
  const title = options.title || source.title;
  const marks = source.marks?.map(([name,x,y])=>`<b class="photo-pin" style="--pin-x:${x}%;--pin-y:${y}%">${name}</b>`).join('') || '';
  const responsive = asset.small ? `srcset="${assetRoot}${asset.small.file} ${asset.small.width}w, ${assetRoot}${asset.file} ${asset.width}w" sizes="${source.sizes || '(max-width: 800px) 94vw, 50vw'}"` : '';
  const frame = options.ratio ? `style="--plate-ratio:${options.ratio}"` : '';
  const visual = `<button type="button" class="image-open${options.ratio ? ' framed-image' : ''}" ${frame} data-open-media data-full="${assetRoot}${asset.file}" ${aria('放大：'+title[0], 'Enlarge: '+title[1])}>
    <img width="${asset.width}" height="${asset.height}" src="${assetRoot}${asset.file}" ${responsive} ${slot === 'cover' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${escape(title[0])}" data-alt-zh="${escape(title[0])}" data-alt-en="${escape(title[1])}">
    <span class="kind-label">${localized(source.version)}</span><span class="photo-pins" aria-hidden="true">${marks}</span><span class="zoom-mark" aria-hidden="true">↗</span></button>`;
  return figure(slot, visual, title, kind, options);
}

function plate(slot, title) {
  const spec = mediaSpecs[slot];
  const ratio = spec.ratio.replace(':',' / ');
  if (media[slot]) return photo(slot, { ratio, title });
  const columns = spec.composition?.columns || 1;
  const subdivisions = columns > 1 ? ` data-columns="${columns}"` : '';
  const visual = `<div class="figure-plate" style="--plate-ratio:${ratio}"${subdivisions}><a href="#${spec.id}">${spec.id}</a></div>`;
  return figure(slot, visual, title || spec.object, 'plate');
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
const plateGrid = (...slots) => `<div class="plate-grid">${slots.map(slot=>plate(slot)).join('')}</div>`;

const stageRail = stages.map(stage=>`<li><a href="#${stage.id}"><span class="step-index">${stage.letter}</span><strong>${localized(stage.title)}</strong></a></li>`).join('');

function historicalStudy(record) {
  return `<article class="history-study" id="${record.id}" data-topic>
    <header class="history-title"><p class="section-kicker">${record.kicker}</p><h3>${localized(record.heading)}</h3></header>
    <div class="history-media${record.figures.length === 3 ? ' history-media-three' : ''}">${record.figures.map(slot=>plate(slot)).join('')}</div>
    <dl class="history-notes">${record.notes.map(([label,copy])=>`<div><dt>${localized(label)}</dt><dd>${localized(copy)}</dd></div>`).join('')}</dl>
  </article>`;
}

function historyChapter(record) {
  return `<section class="chapter history-chapter" id="${record.id}" data-chapter>
    ${sectionTitle(record.id,record.headline,record.lead)}${record.studies.map(historicalStudy).join('')}${record.id === 'eng-built' ? archiveReference() : ''}
  </section>`;
}

const archiveReference = () => `<aside class="archive-reference" id="eng-geometry-reference" data-topic>
  ${tray(['历史 STL 几何对读','Compare archived STL geometry'],`${t('收件包保留原标识，具体打印轮次仍待核对。','Archive package IDs are retained. Their fabrication runs remain unconfirmed.','p','class="archive-note"')}${plateGrid('cad-p01','cad-p04','button-cad')}`)}
</aside>`;

const evolutionThreads = `<section class="evolution-threads" id="eng-tracks" data-topic aria-labelledby="track-heading">
  <h3 id="track-heading">${t('按工程问题追溯','Trace a design problem')}</h3>
  ${threads.map(thread=>`<div class="evolution-thread"><h4>${localized(thread.title)}</h4><ol>${thread.links.map(([letter,target,label])=>`<li><a href="#${target}"><b>${letter}</b>${localized(label)}</a></li>`).join('')}</ol></div>`).join('')}
</section>`;

const body = `
<section class="overview chapter" data-chapter id="eng-overview">
  <div class="hero-grid"><div class="hero-copy">
    <p class="eyebrow">00 / ENGINEERING OVERVIEW</p>
    <h1>THE COST OF<br><em>LIGHTNESS.</em></h1>
    ${t('轻量化的结构代价','An open-base right-hand gaming mouse','h2')}
    ${t('无底壳右手鼠标的五版设计历程。从握持样件、机械结构和实物装配读到最新 CAD。','Five design versions of an open-base right-hand mouse, from a grip mock-up through mechanical builds to the current CAD.','p')}
    <div class="hero-links"><a class="hero-action" href="#eng-form">${t('从外形探索开始','Start with the grip study')} <span aria-hidden="true">↘</span></a><a class="hero-secondary" href="#eng-tracks">${t('按工程问题查看','Explore by design problem')} ↗</a></div>
  </div>${photo('cover', {className:'cover-image'})}</div>
  <ol class="step-rail" ${aria('已记录的工程事件顺序','Sequence of documented engineering events')}>${stageRail}</ol>
</section>

<section class="chapter form-chapter" data-chapter id="eng-form">
  <div class="form-gallery" id="eng-form-comparison" data-topic>
    <div class="form-intro">${sectionTitle('eng-form',['先用试握确定外形。','Find the shape by handling it.'],['先用未分件的 FDM 样件探索右手非对称曲面，随后把外形带入机械结构开发。','An unsplit FDM mock-up established the asymmetric right-hand grip before mechanical development.'])}${photo('form-fdm')}</div>
    ${photo('form-generations')}
  </div>
  <section class="handling-study" id="eng-form-handling" data-topic aria-labelledby="handling-title">
    <header class="handling-title"><p class="section-kicker"><b>A</b>TRIAL GRIP</p><h3 id="handling-title">${t('试握反馈促成一次改形。','Trial handling prompted one form revision.')}</h3>
      ${t('设计者在试握中关注指尖落点、掌心支撑和两侧曲面。','The designer checked where the fingertips landed, how the palm was supported and how each side fit.','p','class="chapter-lead"')}</header>
    <div class="handling-pair">${photo('form-profile')}${plate('grip',['指尖落点与掌心接触','Fingertip landing and palm contact'])}</div>
    ${tray(['改形前后轮廓','Before and after the form change'],plateGrid('matched-form'))}
  </section>
  <div id="milestone-fdm" data-topic>${tray(['外形俯视与 CAD 对照','Top view and form CAD comparison'],plateGrid('evo-fdm','form-cad-compare'))}</div>
  <p class="stage-transition">${t('外形确定后，下一步是给按键运动和内部固定建立独立接口。','Once the grip was set, the next build needed separate interfaces for button travel and internal mounts.')} <a href="#eng-evolution">${t('看分件与首轮 MJF','See part split and first MJF')} ↗</a></p>
</section>

${historicalChapters.map(historyChapter).join('')}

<section class="chapter decisions-chapter" data-chapter id="eng-decisions">
  <div class="refinement-intro" id="milestone-cad" data-topic>
    ${sectionTitle('eng-decisions',['把装配观察落实到新结构。','Translate assembly observations into geometry.'],['最新 CAD 调整了支撑与连接、按键盖、装配路径以及缝隙遮光。','The current CAD revises supports and joints, the button covers, the insertion path and light blocking.'])}
    ${plate('evo-cad')}
  </div>
  ${evolutionThreads}
  <nav class="case-jumps" ${aria('工程专题','Engineering topics')}>${cases.map((record,i)=>`<a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↘</span></a>`).join('')}</nav>
  <article class="engineering-case" id="eng-case-stiffness" data-topic>${caseTitle(0)}
    <div class="case-split">${plate('support-diagram',['当前支撑布局与四处改动','Current support layout and four revisions'])}${plate('base-section')}</div>
    <ol class="change-grid">${structuralChanges.map(([number,title,caption])=>`<li><b>${number}</b><div><strong>${localized(title)}</strong><span>${localized(caption)}</span></div></li>`).join('')}</ol>
    <div class="case-extras">${evidenceNotes(cases[0])}
    ${tray(['前杆、片体与主杆接点','Front rod, functional panel and main joint'],plateGrid('stiffness-compare','functional-fold','main-joint'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-button" data-topic>${caseTitle(1)}
    ${plate('button-diagram',['连接与弯折区：修改前 / 当前设计','Mounting and flex zones: previous / current design'])}
    <div class="case-extras">${evidenceNotes(cases[1])}
    ${tray(['新版按键盖与固定区','Revised cover and mounting zone'],plateGrid('button-new'))}
    ${tray(['片体截面与按压路径','Cover sections and press travel'],plateGrid('button-edge','button-thickness','button-motion'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-battery" data-topic>${caseTitle(2)}
    ${plate('battery-diagram',['装入前 → 向上装入 → 卡口就位','Before insertion → Insert upward → Seated at catch'])}<div class="case-extras">${evidenceNotes(cases[2])}${tray(['定位卡口与固定','Locating catch and retention'],plateGrid('battery-catch'))}</div>
  </article>
  <article class="engineering-case light-case" id="eng-case-light" data-topic>
    <div class="light-split">${caseTitle(3)}${plate('light-diagram',['缝隙剖面：静止 / 按下','Gap section: at rest / pressed'])}</div><div class="case-extras">${evidenceNotes(cases[3])}${tray(['按键盖缝隙剖面','Button cover gap section'],plateGrid('light-section'))}</div>
  </article>
</section>

<section class="chapter current-chapter" data-chapter id="eng-current">
  ${sectionTitle('eng-current',['当前设计与验证边界。','Current design and validation limits.'],['红滚轮样机已完成装配。最新 CAD 的实体打样与性能验证尚待完成。','The red-wheel prototype was assembled. A physical build and performance validation remain pending for the current CAD.'])}
  <div class="current-layout"><div class="status-wrap"><table><thead><tr><th scope="col">${t('系统','System')}</th><th scope="col">${evidenceLabel('designed')}</th><th scope="col">${evidenceLabel('waiting')}</th></tr></thead><tbody>${cases.map((record,i)=>`<tr><th scope="row"><a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↗</span></a></th><td>${localized(record.state)}</td><td>${localized(record.validation)}</td></tr>`).join('')}</tbody></table></div>${plate('current-overview')}</div>
  ${tray(['实物验证项目','Physical checks'],plateGrid('validation'))}
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
${body}
</main></div>
<footer class="reading-progress"><span class="current-section"><b>00</b><span>${t('概览','Overview')}</span></span><div class="reading-track" aria-hidden="true"><span></span></div><output>000%</output><button type="button" data-chapter-prev ${aria('上一章','Previous chapter')} disabled>←</button><button type="button" data-chapter-next ${aria('下一章','Next chapter')}>→</button></footer>
<dialog class="media-dialog" aria-labelledby="media-dialog-title"><header><span id="media-dialog-title">ERSTE002 / ENGINEERING RECORD</span><button type="button" data-media-close>${t('关闭','Close')} ×</button></header><figure><img alt=""><figcaption></figcaption></figure><footer><button type="button" data-media-step="-1">← ${t('上一张','Previous')}</button><output></output><button type="button" data-media-step="1">${t('下一张','Next')} →</button></footer></dialog>
<script type="module" src="./engineering-archive.js"></script></body></html>
`;

const specDoc = [
  '# ERSTE002 ENGINEERING 最终图片素材规格',
  '',
  '正式版采用设计者提供的实物照片、对应版本的 CAD 截图或经设计者确认的标注稿。现有档案照片和 STL 预览为临时排版素材。图号定位到网页上的实际图框。',
  '',
  '点击制作卡末尾的图号链接可定位到正式页面中的对应图位。P0 为支撑因果链的关键历史证据与最新设计视图，P1 为主叙事的实物和装配材料，P2 为补充对照。',
  '比例指网页图框。拍摄或截图时优先保留完整的零件边界和标注余量。多状态原图可以分开提供，网页负责对齐、拼版和双语图注。',
  '素材状态分为待制作、临时占位、最终素材已提供和已验收。拿到符合对应版本的成品可标为已提供。核对版本、机位、必见细节及展示尺寸后才标为已验收。',
  '',
  '## 最简执行清单',
  '',
  '1. 摄影一次台面布景。哑灰背景、柔和顶侧光、固定白平衡及焦距，拍红滚轮装配版三分之四低视角和正前偏侧（O01、P04）。同场拍 FDM 斜俯、正俯和三件同朝向合照（F01、F02、P01）。锁定侧向机位，依次拍同一件 FDM 的空手侧视和右手握持（F03、F04）；握持补拍标明重现。F05 仅在两件改形样件身份都能核实时拍。',
  '2. 核对阶段 A 的改形前后文件，按 H09 导出同基准正俯与侧视。阶段 B 单独归档首轮 MJF 的实拍或 CAD（P02），再导出分件（H01）、初始筋板及垂直截面（H02）、对孔近景（H03）。',
  '3. 阶段 C 从能归到加杆 MJF 的装配文件导出底部内视与 PCB 干涉（P03、P06）。保持同机位、PCB 位置和剖切平面，对照加杆与拆杆（H04）。同场导出按键盖/微动区域（H05）和侧键小板/上盖冲突处（H06）。',
  '4. 阶段 D 先拍同一红滚轮实体的总装与裸壳（P04、S01）。若有同阶段记录，补拍或提取杆件受力、按压翘起和电池装入（S09、K07、B03）。从匹配的历史 CAD 截取按键连接与厚度（H07）及旧电池装入路径（H08）。',
  '5. 从最新 NX 总装导出 P05、C01。P05 概览修订区域，C01 并入最终验证范围。保留文件标识、正交投影及共同基准。',
  '6. 当前结构按 S02–S06 导出底部总览、前杆、功能折边、开口边缘剖面和主杆接点。按键用可归版的旧 CAD 与最新 CAD 做同位置纵剖（K01），另导出 K03–K06 的固定、边缘、厚度和行程。S07、S08 与 K02 属独立 STL 归档对读。',
  '7. 电池按固定侧剖面导出装入前、路径中、到位三帧和卡口近景（B01、B02）。遮光按同一剖面截取静止、按下与修改前状态（L01、L02）。',
  '8. 实拍保留原图，NX 提供无标注 PNG。按图号、前后状态及来源命名，例如 `IMG-H04_with_rod.png` 与 `IMG-H04_rod_removed.png`。附样件身份或文件版本。像素原稿宽度建议为桌面展示宽度的两倍，C02 待对应实物测试后交付。',
  '',
  '## 五组工程事件的采集范围',
  '',
  '项目共有五版。A–E 为工程事件顺序。归档中的空滚轮槽样机保留原称「第二版」。首轮 MJF 与加杆 MJF 分别归档，原件编号与具体打印批次待核。IMG_4235、IMG_4236 确认为红滚轮实体阶段裸壳。历史 STL 保留收件包标识。事件与验证依据见[内部追溯表](ERSTE002-engineering-traceability.md)。',
  '',
  '| 阶段 | 正式素材和主图号 |',
  '| --- | --- |',
  '| A 外形探索 | 未分件 FDM、握持和改形前后实物 / CAD。IMG-F01–F05、IMG-P01、IMG-H09。 |',
  '| B 首轮机械结构 | 首轮 MJF、分件对照、筋板剖面、装配基准与对孔过程。IMG-P02、IMG-H01–H03。 |',
  '| C 支撑与装配 | 加杆内视、PCB 干涉、拆杆前后、微动与限位、侧键板局部。IMG-P03、IMG-P06、IMG-H04–H06。 |',
  '| D 整机装配观察 | 红滚轮总装和裸壳、杆件偏弱、按压翘起、旧按键与电池 CAD、装配过程。IMG-P04、IMG-S01、IMG-S09、IMG-K07、IMG-B03、IMG-H07–H08。 |',
  '| E 最新 CAD 修改 | 总装、前后局部结构、按键纵剖、电池装入、缝隙遮光。IMG-P05、IMG-S02–S06、IMG-K01、IMG-K03–K06、IMG-B01–B02、IMG-L01–L02。 |',
  '',
  '## 组合图排版',
  '',
  '| 图号 | 网页画幅 | 原图与排版 |',
  '| --- | --- | --- |',
  ...Object.values(mediaSpecs).filter(row=>row.composition).map(row=>`| [${row.id}](${pageUrl}#${row.id}) | ${row.ratio}，约 ${row.width} CSS px 宽 | ${row.composition.layout} |`),
  '',
  '可依次命名为 `IMG-S02_current.png`、`IMG-K01_before.png` / `IMG-K01_current.png`、`IMG-B01_01.png` 至 `IMG-B01_03.png`、`IMG-L01_rest.png` / `IMG-L01_pressed.png`。宽图的建议分辨率按拼版总宽计算。',
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
    ...(row.composition ? [`- 网页排版：${row.composition.layout}`] : []),
    `- 取景比例与展示宽度参考：${row.ratio}，1920 桌面视口约 ${row.width} CSS px 宽。像素原稿建议 ≥ ${row.width * 2} px 宽。`,
    `- 用途：${row.purpose[0]}。`,
    `- 当前页面素材：${source ? `\`public/cases/erste002/assets/engineering/${source.file}\`，来源 \`${source.provenance}\`` : '仅显示图号。'}`,
    ...(row.review ? [`- 现有素材评估：${row.review[0]}`] : []),
    `- 素材状态：${media[slot]?.status || (source ? '临时占位' : '待制作')}。`,
    `- [查看页面图位 ${row.id}](${pageUrl}#${row.id})`);
}

await writeFile(new URL('public/cases/erste002/engineering.html', repo), html.replace(/[\t ]+$/gm, ''));
await writeFile(new URL('docs/ERSTE002-engineering-final-media-spec.md', repo), specDoc.join('\n')+'\n');
console.log(`Generated ${chapters.length} chapters, ${cases.length} decisions and ${usedSlots.length} media specs.`);
