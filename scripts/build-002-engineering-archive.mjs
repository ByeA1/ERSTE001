import { readFile, writeFile } from 'node:fs/promises';
import { chapters, cases, media, structuralChanges } from '../content/erste002-engineering-visual.mjs';
import { stages, historicalChapters, threads } from '../content/erste002-engineering-history.mjs';
import { mediaSpecs } from '../content/erste002-engineering-media-spec.mjs';

const repo = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('public/cases/erste002/engineering-assets.json', repo), 'utf8'));
const meshAudit = JSON.parse(await readFile(new URL('docs/erste002-engineering-visual-evidence/route-stl-audit.json', repo), 'utf8'));
const sources = [...meshAudit.packages, ...manifest.photos, ...manifest.cad];
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
  const source = sources.find((record) => record.id === asset.source);
  if (!source) throw new Error(`Unmapped image: ${asset.source}`);
  return source.variants
    ? { ...source.variants.at(-1), small: source.variants[0], provenance: source.source }
    : { file: source.file, width: source.width ?? 1200, height: source.height ?? 900, provenance: source.source };
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
  const gallery = `<div class="history-media${record.figures.length === 3 ? ' history-media-three' : ''}">${record.figures.map(slot=>plate(slot)).join('')}</div>`;
  const hasImages = record.figures.some(slot=>media[slot]);
  return `<article class="history-study" id="${record.id}" data-topic>
    <header class="history-title"><p class="section-kicker">${record.kicker}</p><h3>${localized(record.heading)}</h3></header>
    ${hasImages ? gallery : ''}
    <dl class="history-notes">${record.notes.map(([label,copy])=>`<div><dt>${localized(label)}</dt><dd>${localized(copy)}</dd></div>`).join('')}</dl>
    ${hasImages ? '' : tray(['结构与装配图','Geometry and assembly figures'],gallery)}
  </article>`;
}

function archivedGeometry(slots) {
  return `<aside class="geometry-shelf">
    <div><h3>${t('同机位内侧几何','Matched interior views')}</h3>
    ${t('同一正交机位与比例。编号对应 STL 收件包。','Same orthographic view and scale. Numbers identify the STL packages.', 'p')}</div>
    <div class="history-media">${slots.map(slot=>plate(slot)).join('')}</div>
  </aside>`;
}

function historyChapter(record) {
  const [first, ...remaining] = record.studies;
  return `<section class="chapter history-chapter" id="${record.id}" data-chapter>
    ${sectionTitle(record.id,record.headline,record.lead)}
    ${historicalStudy(first)}
    ${record.archiveSlots ? archivedGeometry(record.archiveSlots) : ''}
    ${remaining.map(historicalStudy).join('')}
    ${record.archiveSlots ? '' : archiveReference()}
  </section>`;
}

const archiveReference = () => `<aside class="archive-reference" id="eng-geometry-reference" data-topic>
  ${tray(['按键盖的历史网格','Archived button cover mesh'],plateGrid('button-cad'))}
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
    ${t('一款无底壳右手鼠标，五版设计。通过实体制造和装配检验薄壁筋板的减料假设。','An open-base right-hand mouse in five design iterations. Physical builds tested the idea that thin walls and ribs could do more with less material.','p')}
    <div class="hero-links"><a class="hero-action" href="#eng-form">${t('从外形探索开始','Start with the grip study')} <span aria-hidden="true">↘</span></a><a class="hero-secondary" href="#eng-tracks">${t('按工程问题查看','Explore by design problem')} ↗</a></div>
  </div>${photo('cover', {className:'cover-image'})}</div>
  <ol class="step-rail" ${aria('已记录的工程事件顺序','Sequence of documented engineering events')}>${stageRail}</ol>
</section>

<section class="chapter form-chapter" data-chapter id="eng-form">
  <div class="form-gallery" id="eng-form-comparison" data-topic>
    <div class="form-intro">${sectionTitle('eng-form',['用薄壁筋板减料，先从试握开始。','A lighter shell began with the grip.'],['原始结构假设是省去下壳，通过上盖的薄壁与筋板分配材料，以获得足够刚度。未分件的 FDM 样件先用于确定右手非对称曲面。','The initial hypothesis was that a thin upper shell and ribs could provide enough stiffness without a lower shell. An unsplit FDM mock-up was used first to shape the asymmetric right-hand grip.'])}${photo('form-fdm')}</div>
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
    <div>${sectionTitle('eng-decisions',['最后一轮重排支撑和机构。','The final revision reworked support and motion.'],['CAD 修改集中在支撑、按键盖和电池装入路径。对应实物尚未打样。','The CAD revisions address support, the button cover and battery insertion. This revision has yet to be built.'])}
    ${t('最终未新增电池卡扣，未实施缝隙遮光。','The final design omits the proposed battery catch and gap light blocking.','p','class="scope-note" id="eng-final-scope" data-topic')}</div>
    ${plate('cad-p05',['收件包 05 · 网格对读','Package 05 · Mesh reference'])}
  </div>
  ${tray(['最终 CAD 总装','Final CAD assembly'],plateGrid('evo-cad'))}
  ${evolutionThreads}
  <nav class="case-jumps" ${aria('工程专题','Engineering topics')}>${cases.map((record,i)=>`<a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↘</span></a>`).join('')}</nav>
  <article class="engineering-case" id="eng-case-stiffness" data-topic>${caseTitle(0)}
    <ol class="change-grid">${structuralChanges.map(([number,title,caption])=>`<li><b>${number}</b><div><strong>${localized(title)}</strong><span>${localized(caption)}</span></div></li>`).join('')}</ol>
    <div class="case-extras">${evidenceNotes(cases[0])}
    ${tray(['支撑总览、折边剖面与连接','Support layout, flange section and joints'],plateGrid('support-diagram','base-section','stiffness-compare','functional-fold','main-joint'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-button" data-topic>${caseTitle(1)}
    <div class="case-extras">${evidenceNotes(cases[1])}
    ${tray(['连接与弯折区对照','Compare mounting and flex zones'],plate('button-diagram') + plateGrid('button-new','button-edge','button-thickness','button-motion'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-battery" data-topic>${caseTitle(2)}
    <div class="case-extras">${evidenceNotes(cases[2])}${tray(['装入前、向上装入与到位','Before insertion, upward path and seated position'],plate('battery-diagram') + plateGrid('battery-clearance'))}</div>
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
  </div>${plate('front-openings')}</div>
  <div class="status-wrap"><table><thead><tr><th scope="col">${t('系统','System')}</th><th scope="col">${evidenceLabel('designed')}</th><th scope="col">${evidenceLabel('waiting')}</th></tr></thead><tbody>${cases.map((record,i)=>`<tr><th scope="row"><a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↗</span></a></th><td>${localized(record.state)}</td><td>${localized(record.validation)}</td></tr>`).join('')}</tbody></table></div>
  ${tray(['总装与实体验证记录','Assembly and physical checks'],plateGrid('current-overview','validation'))}
  <div class="finish"><span>ERSTE002 / ENGINEERING ARCHIVE</span><a href="#eng-overview">${t('回到概览','Back to overview')} ↑</a></div>
</section>`;

if (Object.keys(mediaSpecs).join('|') !== usedSlots.join('|')) {
  throw new Error(`Media pages and production register must match in order.\nPage: ${usedSlots.join(', ')}`);
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
  '4. 阶段 D 同场拍红滚轮实体总装、裸壳内侧和裸壳前部开口（P04、S01、Q01）。若有同阶段记录，补拍或提取杆件受力、按压翘起和电池装入（S09、K07、B03）。从匹配的历史 CAD 截取按键连接与厚度（H07）及旧电池装入路径（H08）。',
  '5. 从最新 NX 总装导出 P05、C01。P05 概览修订区域，C01 并入最终验证范围。保留文件标识、正交投影及共同基准。',
  '6. 当前结构按 S02–S06 导出底部总览、前杆、功能折边、开口边缘剖面和主杆接点。按键用可归版的旧 CAD 与最新 CAD 做同位置纵剖（K01），另导出 K03–K06 的固定、边缘、厚度和行程。独立网格对读 S07、H10、H11、S08、H12 使用统一正交机位。K02 的正式图需要确认对应的历史按键 CAD。',
  '7. 电池沿固定侧剖面导出装入前、向上装入、到位三帧（B01），另截到位后的内支撑和开口间距（B02）。最终方案没有新增卡扣，也没有实施缝隙遮光。',
  '8. 实拍保留原图，NX 提供无标注 PNG。按图号、前后状态及来源命名，例如 `IMG-H04_with_rod.png` 与 `IMG-H04_rod_removed.png`。附样件身份或文件版本。像素原稿宽度建议为桌面展示宽度的两倍，C02 待对应实物测试后交付。',
  '',
  '## 五组工程事件的采集范围',
  '',
  '项目共有五版。A–E 为工程事件顺序。归档中的空滚轮槽样机保留原称「第二版」。首轮 MJF 与加杆 MJF 分别归档，原件编号与具体打印批次待核。IMG_4235、IMG_4236 确认为红滚轮实体阶段裸壳。历史 STL 保留收件包标识。事件与验证依据见[内部追溯表](ERSTE002-engineering-traceability.md)。',
  '',
  '| 阶段 | 正式素材和主图号 |',
  '| --- | --- |',
  '| A 外形探索 | 未分件 FDM、握持和改形前后实物 / CAD。IMG-F01–F05、IMG-P01、IMG-H09。 |',
  '| B 首轮机械结构 | 首轮 MJF、分件对照、筋板剖面、装配基准与对孔过程。IMG-P02、IMG-H01–H03。旁列 IMG-S07、IMG-H10 为独立网格参考。 |',
  '| C 支撑与装配 | 加杆内视、PCB 干涉、拆杆前后、微动与限位、侧键板局部。IMG-P03、IMG-P06、IMG-H04–H06。旁列 IMG-H11、IMG-S08 为独立网格参考。 |',
  '| D 整机装配观察 | 红滚轮总装和裸壳、杆件偏弱、按压翘起、旧按键与电池 CAD、装配过程。IMG-P04、IMG-S01、IMG-S09、IMG-K07、IMG-B03、IMG-H07–H08。 |',
  '| E 最终 CAD 修改 | 总装、前后局部结构、按键纵剖、电池装入。IMG-P05、IMG-S02–S06、IMG-K01、IMG-K03–K06、IMG-B01–B02。IMG-H12 为独立网格参考。 |',
  '| 06 工程结论 | 裸壳前部开口与安装位、最终总装、实体性能记录。IMG-Q01、IMG-C01、IMG-C02。 |',
  '',
  '## 组合图排版',
  '',
  '| 图号 | 网页画幅 | 原图与排版 |',
  '| --- | --- | --- |',
  ...Object.values(mediaSpecs).filter(row=>row.composition).map(row=>`| [${row.id}](${pageUrl}#${row.id}) | ${row.ratio}，约 ${row.width} CSS px 宽 | ${row.composition.layout} |`),
  '',
  '可依次命名为 `IMG-S02_current.png`、`IMG-K01_before.png` / `IMG-K01_current.png`、`IMG-B01_01.png` 至 `IMG-B01_03.png`。宽图的建议分辨率按拼版总宽计算。',
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
