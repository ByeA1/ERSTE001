const root = document.documentElement;
const scroller = document.querySelector('#scroller');
const chapters = [...scroller.querySelectorAll('[data-chapter]')];
const chapterLinks = [...document.querySelectorAll('[data-section-link]')];
const media = [...scroller.querySelectorAll('[data-open-media]')];
const dialog = document.querySelector('.media-dialog');
const previous = document.querySelector('[data-chapter-prev]');
const next = document.querySelector('[data-chapter-next]');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
const documentKey = 'erste002-engineering-route-review';
const aliases = {
  'eng-prologue': 'eng-overview',
  'eng-form-study': 'media-form-fdm',
  'milestones': 'eng-evolution',
  'eng-structure': 'eng-evolution',
  'eng-structure-parts': 'milestone-mjf',
  'eng-structure-ribs': 'media-early-ribs',
  'eng-structure-first-build': 'milestone-mjf',
  'eng-assembly': 'eng-support',
  'eng-assembly-archive-geometry': 'media-cad-p01',
  'eng-assembly-conflicts': 'milestone-support',
  'eng-challenges': 'eng-built',
  'eng-challenge-stiffness': 'media-stiffness-load',
  'eng-challenge-button': 'eng-built-button',
  'eng-challenge-battery': 'media-battery-old',
  'eng-refinement': 'eng-decisions',
  'eng-refinement-structure': 'eng-case-stiffness',
  'eng-refinement-button': 'eng-case-button',
  'eng-refinement-battery': 'eng-case-battery',
  'eng-refinement-light-blocking': 'eng-final-scope',
  'eng-case-light': 'eng-final-scope',
  'IMG-L01': 'eng-final-scope',
  'IMG-L02': 'eng-final-scope',
  'media-battery-catch': 'media-battery-clearance',
  'eng-design-validation-status': 'eng-current',
  'eng-conclusion': 'eng-current',
};

let language = 'zh';
let current = 0;
let imageIndex = 0;
let opener;
let frame = 0;
let scrollTimer = 0;
let paused = false;
let parentReduced = false;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function fragmentId() {
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch { return ''; }
}

function store() {
  history.replaceState({ ...history.state, archiveRead: {
    document: documentKey, target: fragmentId(), scroll: scroller.scrollTop,
  } }, '', location.href);
}

function update() {
  frame = 0;
  if (paused) return;
  const maxScroll = scroller.scrollHeight - scroller.clientHeight;
  const threshold = scroller.getBoundingClientRect().top + Math.min(155, scroller.clientHeight * .2);
  const isEnd = maxScroll > 0 && maxScroll - scroller.scrollTop < 3;
  current = isEnd ? chapters.length - 1 : Math.max(0, chapters.findLastIndex(chapter => chapter.getBoundingClientRect().top <= threshold));
  chapterLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const item = chapterLinks[current];
  document.querySelector('.current-section b').textContent = item.firstElementChild.textContent;
  document.querySelector('.current-section > span').textContent = item.querySelector('[data-zh]').dataset[language];
  previous.disabled = current === 0;
  next.disabled = current === chapters.length - 1;
  const percent = Math.round(scroller.scrollTop / Math.max(1, maxScroll) * 100);
  document.querySelector('.reading-track > span').style.width = `${percent}%`;
  document.querySelector('.reading-progress output').textContent = `${String(percent).padStart(3, '0')}%`;
  document.body.dataset.archiveSection = chapters[current].id;
}

function schedule() {
  if (!frame && !paused) frame = requestAnimationFrame(update);
}

function resolveTarget(id) {
  const name = Object.hasOwn(aliases, id) ? aliases[id] : id;
  const target = document.getElementById(name);
  if (!target || !scroller.contains(target)) return null;
  return target.matches('figcaption') ? target.closest('figure') : target;
}

function go(id, { push = true, scroll, focus = true } = {}) {
  const target = resolveTarget(id);
  if (!target) return false;
  clearTimeout(scrollTimer);
  if (push) {
    store();
    const fragment = id === target.dataset.mediaId ? id : target.id;
    history.pushState({ ...history.state, archiveRead: { document: documentKey, target: fragment } }, '', `#${fragment}`);
  }
  for (let node = target; node && node !== scroller; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  const top = Number.isFinite(scroll) ? scroll : scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 16;
  scroller.scrollTo({ top: Math.max(0, top), behavior: push && !motion.matches && !parentReduced ? 'smooth' : 'instant' });
  if (focus) {
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
  scrollTimer = setTimeout(store, 200);
  schedule();
  return true;
}

scroller.addEventListener('scroll', () => {
  schedule();
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(store, 200);
}, { passive: true });
scroller.addEventListener('toggle', schedule, true);
document.addEventListener('click', (event) => {
  if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (link && go(link.hash.slice(1))) event.preventDefault();
});
previous.addEventListener('click', () => { if (current > 0) go(chapters[current - 1].id); });
next.addEventListener('click', () => { if (current < chapters.length - 1) go(chapters[current + 1].id); });

function restore() {
  const id = fragmentId();
  const record = history.state?.archiveRead;
  go(id || chapters[0].id, {
    push: false, focus: false,
    scroll: record?.document === documentKey && record.target === id ? record.scroll : undefined,
  });
}
addEventListener('popstate', restore);
addEventListener('hashchange', () => requestAnimationFrame(restore));
addEventListener('load', () => requestAnimationFrame(restore), { once: true });
addEventListener('resize', schedule);
addEventListener('pagehide', store);

function describeImage() {
  const button = media[imageIndex];
  const image = dialog.querySelector('img');
  const figure = button.closest('figure');
  image.src = button.dataset.full;
  image.alt = button.querySelector('img').alt;
  dialog.querySelector('figcaption').textContent = figure.querySelector('figcaption').innerText.replaceAll('\n', ' · ');
  dialog.querySelector('output').textContent = `${String(imageIndex + 1).padStart(2,'0')} / ${media.length}`;
  dialog.dataset.mediaSlot = figure.dataset.mediaSlot;
}

function stepImage(direction) {
  imageIndex = (imageIndex + direction + media.length) % media.length;
  describeImage();
}

function closeImage() {
  dialog.close();
  dialog.querySelector('img').removeAttribute('src');
  opener?.focus({ preventScroll: true });
}

for (const [index, button] of media.entries()) {
  button.addEventListener('click', () => {
    const figure = button.closest('figure');
    if (figure.classList.contains('image-failed')) {
      const image = button.querySelector('img');
      figure.classList.remove('image-failed');
      image.removeAttribute('srcset');
      image.src = `${button.dataset.full}?retry=${Date.now()}`;
      return;
    }
    imageIndex = index;
    opener = button;
    describeImage();
    dialog.showModal();
  });
}
document.querySelector('[data-media-close]').onclick = closeImage;
for (const button of document.querySelectorAll('[data-media-step]')) button.onclick = () => stepImage(Number(button.dataset.mediaStep));
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeImage(); });
document.addEventListener('keydown', (event) => {
  if (!dialog.open || !['Escape','ArrowLeft','ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.key === 'Escape') closeImage();
  else stepImage(event.key === 'ArrowLeft' ? -1 : 1);
}, true);
document.addEventListener('error', (event) => {
  if (event.target instanceof HTMLImageElement) event.target.closest('.archive-media')?.classList.add('image-failed');
}, true);

function setLanguage(value, notify = false) {
  if (!['zh', 'en'].includes(value)) return;
  const viewportTop = scroller.getBoundingClientRect().top;
  const anchor = [...scroller.querySelectorAll('[data-chapter],[data-topic]')].findLast(node => node.getBoundingClientRect().top <= viewportTop + 50);
  const before = anchor?.getBoundingClientRect().top;
  language = value;
  root.lang = value === 'zh' ? 'zh-CN' : 'en';
  for (const node of document.querySelectorAll('[data-zh][data-en]')) node.textContent = node.dataset[value];
  for (const node of document.querySelectorAll('[data-alt-zh]')) node.alt = value === 'zh' ? node.dataset.altZh : node.dataset.altEn;
  for (const node of document.querySelectorAll('[data-aria-zh]')) node.setAttribute('aria-label', value === 'zh' ? node.dataset.ariaZh : node.dataset.ariaEn);
  for (const button of document.querySelectorAll('[data-archive-language]')) button.setAttribute('aria-pressed', String(button.dataset.archiveLanguage === value));
  for (const button of media) button.dataset.loadError = value === 'zh' ? '重新载入图片 ↻' : 'Reload image ↻';
  if (anchor) scroller.scrollTop += anchor.getBoundingClientRect().top - before;
  if (dialog.open) describeImage();
  if (notify) {
    try { localStorage.setItem('portfolio-language', value); } catch {}
    if (params.has('lang')) {
      const url = new URL(location.href);
      url.searchParams.set('lang', value);
      history.replaceState(history.state, '', url);
    }
    if (parent !== window) parent.postMessage({ type: 'design-terminal:case-language', language: value }, location.origin);
  }
  update();
}

for (const button of document.querySelectorAll('[data-archive-language]')) button.onclick = () => setLanguage(button.dataset.archiveLanguage, true);
addEventListener('message', (event) => {
  if (event.source !== parent || event.origin !== location.origin) return;
  const data = event.data || {};
  if (data.type === 'design-terminal:case-language') setLanguage(data.language);
  if (data.type === 'design-terminal:case-policy') parentReduced = Boolean(data.reduced);
  if (data.type === 'design-terminal:pause') { paused = true; cancelAnimationFrame(frame); frame = 0; }
  if (data.type === 'design-terminal:resume') { paused = false; schedule(); }
});

let savedLanguage;
try { savedLanguage = localStorage.getItem('portfolio-language'); } catch {}
const requestedLanguage = params.get('lang') || savedLanguage;
setLanguage(requestedLanguage === 'en' ? 'en' : 'zh');
restore();
update();
