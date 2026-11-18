import { readFile, writeFile } from 'node:fs/promises';
import { chapters, cases, steps, media, structuralChanges } from '../content/erste002-engineering-visual.mjs';
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

function sectionTitle(index, headline, lead) {
  const [, number, , name] = chapters[index];
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

const stepRail = steps.map((step, i)=>`<li><a href="#milestone-${step.id}"><span class="step-index">0${i+1}</span><strong>${localized(step.name)}</strong></a></li>`).join('');

const body = `
<section class="overview chapter" data-chapter id="eng-overview">
  <div class="hero-grid"><div class="hero-copy">
    <p class="eyebrow">00 / ENGINEERING OVERVIEW</p>
    <h1>THE COST OF<br><em>LIGHTNESS.</em></h1>
    ${t('轻量化的结构代价','An open-base right-hand gaming mouse','h2')}
    ${t('无底壳的右手工学鼠标。从手感样件到四项工程设计修改。','From the grip mock-up to four mechanical design decisions.','p')}
    <div class="hero-links"><a class="hero-action" href="#eng-decisions">${t('工程决策','Engineering decisions')} <span aria-hidden="true">↘</span></a><a class="hero-secondary" href="#eng-current">${t('当前设计','Current design')} ↗</a></div>
  </div>${photo('cover', {className:'cover-image'})}</div>
  <ol class="step-rail" ${aria('五个工程里程碑','Five engineering milestones')}>${stepRail}</ol>
</section>

<section class="chapter form-chapter" data-chapter id="eng-form">
  <div class="form-gallery" id="eng-form-comparison" data-topic>
    <div class="form-intro">${sectionTitle(1,['从手感样件定形。','Develop the shape in hand.'],['从未分件的 FDM 样件发展为右手非对称曲面。','An unsplit FDM sample led to the asymmetric right-hand shell.'])}${photo('form-fdm')}</div>
    ${photo('form-generations')}
  </div>
  <section class="handling-study" id="eng-form-handling" data-topic aria-labelledby="handling-title">
    <header class="handling-title"><p class="section-kicker"><b>01</b>GRIP STUDY</p><h3 id="handling-title">${t('一次试握确定了改形方向。','A trial grip guided the form revision.')}</h3>
      ${t('设计者在试握中关注指尖落点、掌心支撑和两侧曲面。','The designer checked where the fingertips landed, how the palm was supported and how each side fit.','p','class="chapter-lead"')}</header>
    <div class="handling-pair">${photo('form-profile')}${plate('grip',['指尖落点与掌心接触','Fingertip landing and palm contact'])}</div>
    ${tray(['改形前后轮廓','Before and after the form change'],plateGrid('matched-form'))}
  </section>
</section>

<section class="chapter evolution-chapter" data-chapter id="eng-evolution">
  ${sectionTitle(2,['五个工程里程碑。','Five engineering milestones.'])}
  <ol class="milestone-grid" id="milestones">${steps.map((step,i)=>{
    const image = media[step.image] ? photo(step.image) : plate(step.image);
    const noteTitle = step.id === 'cad' ? ['设计取舍','Design trade-off'] : ['关键发现','Key finding'];
    const details = `<details class="milestone-notes"><summary>${t('制作与后续','Build and follow-up')}</summary><dl><div><dt>${t('制作','Built')}</dt><dd>${localized(step.action)}</dd></div><div><dt>${t('后续','Next')}</dt><dd>${localized(step.next)}</dd></div></dl></details>`;
    return `<li id="milestone-${step.id}" data-topic><div class="milestone-heading"><span>0${i+1} / ${step.stage}</span><h3>${localized(step.name)}</h3></div>${image}<p class="milestone-finding"><span>${localized(noteTitle)}</span><strong>${localized(step.finding)}</strong></p>${details}</li>`;
  }).join('')}</ol>
  ${tray(['装配干涉','Assembly interference'],plateGrid('interference'))}
</section>

<section class="chapter decisions-chapter" data-chapter id="eng-decisions">
  ${sectionTitle(3,['四个工程决策。','Four engineering decisions.'])}
  <nav class="case-jumps" ${aria('工程专题','Engineering topics')}>${cases.map((record,i)=>`<a href="#eng-case-${record.id}"><b>0${i+1}</b>${localized(record.short)} <span aria-hidden="true">↘</span></a>`).join('')}</nav>
  <article class="engineering-case" id="eng-case-stiffness" data-topic>${caseTitle(0)}
    <div class="case-split">${photo('stiffness-photo')}${plate('support-diagram',['当前支撑布局与四处改动','Current support layout and four revisions'])}</div>
    <ol class="change-grid">${structuralChanges.map(([number,title,caption])=>`<li><b>${number}</b><div><strong>${localized(title)}</strong><span>${localized(caption)}</span></div></li>`).join('')}</ol>
    <div class="case-extras">${evidenceNotes(cases[0])}
    ${tray(['新版支撑与截面','Revised supports and sections'],plateGrid('stiffness-compare','functional-fold','base-section','main-joint'))}
    ${tray(['历史 CAD 几何','Historical CAD geometry'],`<div class="case-split cad-pair">${photo('cad-p01')}${photo('cad-p04')}</div>`)}
    ${tray(['壳体受力观察','Shell under load'],plateGrid('stiffness-load'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-button" data-topic>${caseTitle(1)}
    ${plate('button-diagram',['连接与弯折区：修改前 / 当前设计','Mounting and flex zones: previous / current design'])}
    <div class="case-extras">${evidenceNotes(cases[1])}
    ${tray(['按键盖几何对照','Compare button geometry'],`<div class="case-split">${photo('button-cad')}${plate('button-new',['新版按键盖与固定区','Revised cover and mounting zone'])}</div>`)}
    ${tray(['片体截面与按压路径','Cover sections and press travel'],plateGrid('button-edge','button-thickness','button-motion','button-observed'))}</div>
  </article>
  <article class="engineering-case" id="eng-case-battery" data-topic>${caseTitle(2)}
    ${plate('battery-diagram',['装入前 → 向上装入 → 卡口就位','Before insertion → Insert upward → Seated at catch'])}<div class="case-extras">${evidenceNotes(cases[2])}${tray(['卡口与装配过程','Catch and assembly sequence'],plateGrid('battery-catch','battery-old'))}</div>
  </article>
  <article class="engineering-case light-case" id="eng-case-light" data-topic>
    <div class="light-split">${caseTitle(3)}${plate('light-diagram',['缝隙剖面：静止 / 按下','Gap section: at rest / pressed'])}</div><div class="case-extras">${evidenceNotes(cases[3])}${tray(['按键盖缝隙剖面','Button cover gap section'],plateGrid('light-section'))}</div>
  </article>
</section>

<section class="chapter current-chapter" data-chapter id="eng-current">
  ${sectionTitle(4,['当前设计与工程边界。','Current design and engineering limits.'],['四个系统已完成 CAD 修改。红滚轮版是最近的实体样机。','Revisions to four systems are complete in CAD. The red-wheel version is the latest physical build.'])}
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
  '点击制作卡末尾的图号链接可定位到正式页面中的对应图位。P0 为新版核心结构与装配视图，P1 为主叙事及关键历史证据，P2 为补充对照。',
  '比例指网页图框。拍摄或截图时优先保留完整的零件边界和标注余量。多状态原图可以分开提供，网页负责对齐、拼版和双语图注。',
  '素材状态分为待制作、临时占位、最终素材已提供和已验收。拿到符合对应版本的成品可标为已提供。核对版本、机位、必见细节及展示尺寸后才标为已验收。',
  '',
  '## 最简执行清单',
  '',
  '1. 摄影一次台面布景。哑灰背景、柔和顶侧光、固定白平衡及焦距，拍红滚轮装配版三分之四低视角和正前偏侧（O01、P04）。同场拍 FDM 斜俯、正俯和三件同朝向合照（F01、F02、P01）。锁定侧向机位，依次拍同一件 FDM 的空手侧视和右手握持（F03、F04）；握持补拍标明重现。F05 仅在两件改形样件身份都能核实时拍。',
  '2. 历史零件另成一组。核对首轮 MJF、加杆版、红滚轮版裸上盖的身份。以同一光线拍分件摊开、孔位近景、底部内视（P02、P03、S01）。能追溯时再补 PCB 干涉、按压、电池松动和整体偏软的过程证据（P06、K07、B03、S09）。',
  '3. NX 总装先完成 P05、C01。当前 CAD 保存三分之四总装视图和底部内视。同一组截图供两个图位使用，P05 裁成节点图，C01 保留全景及四处标注。统一背景、投影、缩放与坐标轴，保留文件版本。',
  '4. NX 结构一次截取 S02–S06。先从当前总装导出一张朝向与 S01 一致的底部内侧总览（S02）；再锁定同一正交相机做前后对比（S03）。同场截功能片体、开口边缘法向剖面和主杆与上盖接点。S07–S08 采用经核实的历史文件。',
  '5. NX 按键一次截取 K01–K06。先导出两版同位置纵剖（K01），再导出两版同机位内侧轴测（K02、K03）。保留连接板、厚薄变化、微动及限位实际位置，另截边缘、厚度和行程局部。',
  '6. NX 电池和遮光分别截 B01–B02、L01–L02。电池按固定侧剖面导出装入前、路径中、到位三帧，另截卡口。遮光先导出当前设计静止与按下状态（L01），再在相同剖切位置导出修改前的局部，供 L02 对读。',
  '7. 按图号交付。实拍保留原图，NX 提供无标注 PNG。标注副本可选，文件名示例为 `IMG-S05_before.png`、`IMG-S05_after.png`、`IMG-S05_after_annotated.png`。每组附简短的文件版本或样件身份及视图说明。按下方比例留裁切边距，推荐原稿宽度为桌面展示宽度的两倍。C02 等对应实物测试完成后再补。',
  '',
  '## 四张工程主图排版',
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
