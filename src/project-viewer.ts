import './project-case.css';
import { getProject } from './projects';
import { ProjectLoading } from './project-loading';
import { ProjectInterface, waitForProjectReady } from './project-interface';
import {PROJECT_RETURN_DURATION,projectReturnAt} from './project-entry-motion';
import {t,languageControls,localize,currentLanguage,setTerminalLanguage} from './terminal-language';

let panel: HTMLDialogElement | undefined;
let opener: HTMLElement | null = null;
let activeFrame: HTMLIFrameElement | undefined;
let loading: ProjectLoading;
let activeSignal: AbortSignal;
const frames = new Map<string, HTMLIFrameElement>();
const interfaces = new Map<HTMLIFrameElement, ProjectInterface>();
export const caseIsOpen = () => panel?.open === true;
export const caseIsApproaching = () => caseIsOpen() && (panel?.dataset.casePhase === 'approach'||panel?.dataset.casePhase==='returning');
let returnFrame=0;
let closeCleaned = true;
function finishProjectClose() {
  // dialog.close() queues its event. A fast reopen must finish old cleanup
  // before starting the next load, rather than cancel that next load later.
  if (!panel || panel.open || closeCleaned) return;
  closeCleaned = true;
  tellCase('pause');
  cancelAnimationFrame(returnFrame);
  document.documentElement.classList.remove('case-returning');
  document.documentElement.style.removeProperty('--case-return-ui');
  panel.style.removeProperty('--return-scan-y');
  panel.removeAttribute('aria-busy');
  loading.cancel();
  document.documentElement.classList.remove('case-open', 'case-approaching');
  window.dispatchEvent(new Event('design-terminal:case-return'));
  opener?.focus({ preventScroll: true });
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new CustomEvent('design-terminal:case-showcase', { detail: { projectId: activeFrame?.dataset.projectId } }));
}
/** Cached case iframes keep their own RAF; tell them to stop when hidden. */
function tellCase(type: 'pause' | 'resume') {
  const frame = activeFrame;
  if (!frame?.contentWindow) return;
  const active = type === 'resume' && !document.hidden && caseIsOpen();
  interfaces.get(frame)?.setActive(active);
  try { frame.contentWindow.postMessage({ type: `design-terminal:${active ? 'resume' : 'pause'}` }, location.origin); } catch {}
}
export function closeProject() {
  if(!panel?.open || panel.dataset.casePhase==='returning')return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced || !document.querySelector('#three-scene canvas')){panel.close();return;}
  loading.cancel();
  tellCase('pause');
  window.dispatchEvent(new CustomEvent('design-terminal:case-showcase',{detail:{projectId:activeFrame?.dataset.projectId}}));
  panel.dataset.casePhase='returning';
  panel.setAttribute('aria-busy','true');
  if(activeFrame)activeFrame.inert=true;
  document.documentElement.classList.add('case-returning');
  panel.style.setProperty('--return-scan-y','100%');
  document.documentElement.style.setProperty('--case-return-ui','0');
  window.dispatchEvent(new Event('design-terminal:case-return-start'));
  const start=performance.now();
  const tick=(now:number)=>{
    if(!panel?.open)return;
    const elapsed=(now-start)/1000,cue=projectReturnAt(elapsed);
    panel.style.setProperty('--return-scan-y',`${cue.scan*100}%`);
    document.documentElement.style.setProperty('--case-return-ui',String(cue.ui));
    if(elapsed>=PROJECT_RETURN_DURATION){panel.close();return;}
    returnFrame=requestAnimationFrame(tick);
  };
  returnFrame=requestAnimationFrame(tick);
}

function createPanel() {
  panel = document.createElement('dialog');
  panel.className = 'project-case';
  panel.innerHTML = `<header class="project-case-bar"><div><span class="project-case-number"></span><strong class="project-case-title"></strong></div><div class="project-case-actions">${languageControls()}<button type="button" class="project-case-close" data-zh="← 返回档案展示" data-en="← Back to archive">← 返回档案展示</button></div></header>`;
  document.body.append(panel);
  loading = new ProjectLoading(panel, () => {
    if (!activeFrame) return;
    const id = activeFrame.dataset.projectId!;
    const section = activeFrame.dataset.section ?? '';
    frames.delete(id);
    interfaces.get(activeFrame)?.destroy(); interfaces.delete(activeFrame);
    activeFrame.remove();
    openProject(id, section);
  }, () => {
    const frame = activeFrame, signal = activeSignal;
    if (!frame || frame.dataset.loaded !== 'true') return;
    void loading.reveal(signal, true).then(() => {
      if (!signal.aborted && frame === activeFrame) frame.inert = false;
    });
  });
  panel.querySelector('.project-case-close')!.addEventListener('click', closeProject);
  panel.addEventListener('cancel',event=>{event.preventDefault();closeProject();});
  panel.addEventListener('close', finishProjectClose);
  window.addEventListener('message', event => {
    if (!caseIsOpen() || event.origin !== location.origin || event.source !== activeFrame?.contentWindow) return;
    if (event.data?.type === 'design-terminal:close-project') closeProject();
    if(event.data?.type === 'design-terminal:case-ready')syncCaseLanguage();
    if(event.data?.type === 'design-terminal:case-language' && (event.data.language==='zh'||event.data.language==='en') && event.data.language!==currentLanguage())setTerminalLanguage(event.data.language);
    if (event.data?.type === 'design-terminal:open-project' && typeof event.data.projectId === 'string') {
      openProject(event.data.projectId, typeof event.data.section === 'string' ? event.data.section : '');
    }
  });
}

/** Open a registered same-site case without changing the terminal URL. */
export function openProject(projectId: string, section = ''): boolean {
  finishProjectClose();
  if(panel?.dataset.casePhase==='returning' && panel.open)return false;
  const project = getProject(projectId);
  if (!project?.page || !project.page.startsWith('/') || project.page.startsWith('//')) return false;
  if (!panel) createPanel();
  if (!caseIsOpen()) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  panel!.setAttribute('aria-label', `${project.title} 完整设计案例`);
  panel!.querySelector('.project-case-number')!.textContent = `DESIGN ARCHIVE / ${project.number}`;
  panel!.querySelector('.project-case-title')!.textContent = project.title;
  tellCase('pause');
  for (const frame of frames.values()) frame.hidden = true;
  const sectionId = section.replace(/^#/, '');
  const validSection = /^[A-Za-z][\w:.-]{0,79}$/.test(sectionId) ? sectionId : '';
  let frame = frames.get(projectId);
  if (!frame) {
    frame = document.createElement('iframe');
    frame.className = 'project-case-frame';
    frame.title = `${project.title} 完整设计案例内容`;
    frame.dataset.projectId = projectId;
    frame.src = project.page;
    frame.addEventListener('load', () => {
      frame!.dataset.loaded = 'true';
      if (interfaces.get(frame!)?.document !== frame!.contentDocument) {
        interfaces.get(frame!)?.destroy(); interfaces.delete(frame!);
      }
    });
    frames.set(projectId, frame);
    panel!.append(frame);
  }
  frame.hidden = false;
  frame.inert = true;
  frame.dataset.section = validSection;
  activeFrame = frame;
  const approach=!caseIsOpen() && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.classList.contains('cassette-showcase') && Boolean(document.querySelector('#three-scene canvas'));
  activeSignal = loading.begin(project,approach);
  document.documentElement.classList.add('case-open');
  if (!panel!.open) { closeCleaned = false; panel!.showModal(); }
  tellCase('resume');
  localize(panel!);
  void prepareProject(frame, activeSignal);
  panel!.querySelector<HTMLButtonElement>('.project-case-close')!.focus();
  return true;
}

async function prepareProject(frame: HTMLIFrameElement, signal: AbortSignal) {
  const work = new AbortController();
  let pageReady = false;
  const cancel = () => work.abort();
  signal.addEventListener('abort', cancel, { once: true });
  try {
    await bounded(waitForDocument(frame, work.signal), work.signal);
    if (signal.aborted || frame !== activeFrame) return;
    const doc = frame.contentDocument;
    if (!doc?.body || doc.getElementById('stage')) throw new Error('项目页面暂时无法打开，请重试。');
    pageReady = true;
    if (!interfaces.has(frame)) interfaces.set(frame, new ProjectInterface(frame, closeProject));
    interfaces.get(frame)!.setActive(frame === activeFrame && caseIsOpen() && !document.hidden);
    syncCaseLanguage();
    loading.preparing();
    scrollToSection(frame);
    const images = [...doc.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < (frame.contentWindow?.innerHeight ?? frame.clientHeight);
    });
    await bounded(Promise.all([
      doc.fonts.ready,
      ...images.map(image => image.decode().catch(() => undefined)),
      waitForModel(doc, work.signal),
      waitForProjectReady(doc, work.signal),
    ]), work.signal);
    if (signal.aborted || frame !== activeFrame) return;
    await loading.reveal(signal);
    if (!signal.aborted && frame === activeFrame) frame.inert = false;
  } catch (error) {
    if (signal.aborted || frame !== activeFrame) return;
    loading.fail(error instanceof Error ? error.message : '项目暂未准备完成，请重试。', pageReady);
  } finally {
    work.abort();
    signal.removeEventListener('abort', cancel);
  }
}
function syncCaseLanguage() {
  if(activeFrame && panel) {
    panel.setAttribute('aria-label',t(`${panel.querySelector('.project-case-title')!.textContent} 完整设计案例`,`${panel.querySelector('.project-case-title')!.textContent} complete design case`));
  }
  if (activeFrame) interfaces.get(activeFrame)?.localize();
}
window.addEventListener('design-terminal:language',syncCaseLanguage);
document.addEventListener('visibilitychange', () => tellCase(document.hidden ? 'pause' : 'resume'));

function waitForDocument(frame: HTMLIFrameElement, signal: AbortSignal) {
  if (frame.dataset.loaded === 'true') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      frame.removeEventListener('load', loaded);
      frame.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('项目页面载入失败，请重试。')); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    frame.addEventListener('load', loaded, { once: true });
    frame.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
}

/** Observe the existing 002 viewer without changing its model or case code. */
function waitForModel(doc: Document, signal: AbortSignal) {
  const status = doc.getElementById('statusText');
  const assembly = doc.querySelector<HTMLInputElement>('#assembly');
  if (!status || !assembly) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { observer.disconnect(); signal.removeEventListener('abort', aborted); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const check = () => {
      if (status.classList.contains('err') || /FAILED|ERROR/i.test(status.textContent ?? '')) {
        cleanup(); reject(new Error('三维模型暂未载入，可重试或先查看项目页面。'));
      } else if (!assembly.disabled && !/^(IDLE|LOADING)$/i.test(status.textContent?.trim() ?? '')) {
        cleanup(); resolve();
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'class'] });
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted(); else check();
  });
}

function bounded<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', aborted); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('载入用时较长，请重试或返回项目选择。')); }, 25000);
    signal.addEventListener('abort', aborted, { once: true });
    work.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
    if (signal.aborted) aborted();
  });
}

function scrollToSection(frame: HTMLIFrameElement) {
  if (frame.dataset.section) {
    frame.contentDocument?.getElementById(frame.dataset.section)?.scrollIntoView({ behavior: 'instant' });
    delete frame.dataset.section;
  }
}

declare global {
  interface Window {
    DesignTerminal: { openProject: typeof openProject; closeProject: typeof closeProject };
  }
}
window.DesignTerminal = { openProject, closeProject };
