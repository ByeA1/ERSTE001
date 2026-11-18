import './project-case.css';
import { getProject } from './projects';
import { ProjectLoading } from './project-loading';
import { ProjectInterface, waitForProjectReady } from './project-interface';
import {PROJECT_RETURN_DURATION,projectReturnAt} from './project-entry-motion';
import {t,localize,currentLanguage,setTerminalLanguage} from './terminal-language';
import { siteNavigation } from './site-navigation';

let panel: HTMLDialogElement | undefined;
let opener: HTMLElement | null = null;
let activeFrame: HTMLIFrameElement | undefined;
let loading: ProjectLoading;
let activeSignal: AbortSignal;
const frames = new Map<string, HTMLIFrameElement>();
const interfaces = new Map<HTMLIFrameElement, ProjectInterface>();
export const caseIsOpen = () => panel?.open === true;
export const caseIsApproaching = () => caseIsOpen() && (panel?.dataset.casePhase === 'approach' || panel?.dataset.casePhase === 'returning');
let returnFrame=0;
let closeCleaned = true;
function finishProjectClose() {
  // dialog.close() queues its event. A fast reopen must finish old cleanup
  // before starting the next load, rather than cancel that next load later.
  if (!panel || panel.open || closeCleaned) return;
  closeCleaned = true;
  tellCase('pause');
  const projectId = activeFrame?.dataset.projectId;
  if (activeFrame && getProject(projectId)?.releaseOnClose) releaseFrame(activeFrame);
  activeFrame = undefined;
  siteNavigation.hideProject();
  cancelAnimationFrame(returnFrame);
  document.documentElement.classList.remove('case-returning');
  document.documentElement.style.removeProperty('--case-return-ui');
  panel.style.removeProperty('--return-scan-y');
  panel.removeAttribute('aria-busy');
  loading.cancel();
  document.documentElement.classList.remove('case-open', 'case-approaching');
  window.dispatchEvent(new Event('design-terminal:case-return'));
  window.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new CustomEvent('design-terminal:case-showcase', { detail: { projectId } }));
  if (opener && opener !== document.body && opener.getClientRects().length && !opener.closest('[hidden],[inert]'))
    opener.focus({ preventScroll: true });
  else document.querySelector<HTMLButtonElement>('#stage .back-button')?.focus({ preventScroll: true });
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
  document.body.append(panel);
  loading = new ProjectLoading(panel, () => {
    if (!activeFrame) return;
    const id = activeFrame.dataset.projectId!;
    const section = activeFrame.dataset.section ?? '';
    releaseFrame(activeFrame);
    activeFrame = undefined;
    openProject(id, section);
  }, () => {
    const frame = activeFrame, signal = activeSignal;
    if (!frame || frame.dataset.loaded !== 'true') return;
    void loading.reveal(signal, true).then(() => {
      presentFrame(frame, signal);
    });
  }, closeProject);
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

function releaseFrame(frame: HTMLIFrameElement) {
  interfaces.get(frame)?.destroy();
  interfaces.delete(frame);
  frames.delete(frame.dataset.projectId!);
  if (frame.contentDocument)
    frame.contentWindow?.dispatchEvent(new Event('design-terminal:dispose'));
  frame.remove();
}

function caseFrame(projectId: string, page: string, title: string) {
  if (!panel) createPanel();
  let frame = frames.get(projectId);
  if (!frame) {
    frame = document.createElement('iframe');
    frame.className = 'project-case-frame';
    frame.title = title;
    frame.dataset.projectId = projectId;
    frame.hidden = true;
    frame.inert = true;
    frame.src = page;
    frame.addEventListener('load', () => {
      frame!.dataset.loaded = 'true';
      if (interfaces.get(frame!)?.document !== frame!.contentDocument) {
        interfaces.get(frame!)?.destroy(); interfaces.delete(frame!);
      }
    });
    frames.set(projectId, frame);
    panel!.append(frame);
  }
  return frame;
}

/** Open a registered same-site case without changing the terminal URL. */
export function openProject(projectId: string, section = ''): boolean {
  finishProjectClose();
  if (panel?.dataset.casePhase === 'returning' && panel.open) return false;
  const project = getProject(projectId);
  if (!project?.page || !project.page.startsWith('/') || project.page.startsWith('//')) return false;
  if (!caseIsOpen()) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (caseIsOpen() && activeFrame?.dataset.projectId === projectId && !section) return true;
  tellCase('pause');
  if (activeFrame && activeFrame.dataset.projectId !== projectId && getProject(activeFrame.dataset.projectId)?.releaseOnClose)
    releaseFrame(activeFrame);
  for (const frame of frames.values()) frame.hidden = true;
  const sectionId = section.replace(/^#/, '');
  const validSection = /^[A-Za-z][\w:.-]{0,79}$/.test(sectionId) ? sectionId : '';
  const frame = caseFrame(project.id, project.page, project.title);
  frame.hidden = false;
  frame.inert = true;
  frame.dataset.section = validSection;
  activeFrame = frame;
  const approach=!caseIsOpen() && !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.classList.contains('cassette-showcase') && Boolean(document.querySelector('#three-scene canvas'));
  activeSignal = loading.begin(project, approach);
  siteNavigation.showProject(panel!, project, id => openProject(id), closeProject);
  document.documentElement.classList.add('case-open');
  if (!panel!.open) { closeCleaned = false; panel!.showModal(); }
  tellCase('resume');
  syncCaseLanguage();
  localize(panel!);
  void prepareProject(frame, activeSignal);
  panel!.focus({ preventScroll: true });
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
    tellCase('resume');
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
      doc.body.hasAttribute('data-project-ready') ? Promise.resolve() : waitForModel(doc, work.signal),
      waitForProjectReady(doc, work.signal),
    ]), work.signal, () => {
      const progress=doc.body.dataset.projectLoadProgress;
      loading.progress(progress);
      return progress;
    });
    if (signal.aborted || frame !== activeFrame) return;
    await loading.reveal(signal);
    presentFrame(frame, signal);
  } catch (error) {
    if (signal.aborted || frame !== activeFrame) return;
    loading.fail(error instanceof Error ? error.message : '项目暂未准备完成，请重试。', pageReady);
  } finally {
    work.abort();
    signal.removeEventListener('abort', cancel);
  }
}
function presentFrame(frame: HTMLIFrameElement, signal: AbortSignal) {
  if (signal.aborted || frame !== activeFrame) return;
  frame.inert = false;
  interfaces.get(frame)?.present();
  // The host may now attach before a slow module finishes evaluating. Re-send
  // visibility at presentation, when the project's message listeners exist.
  tellCase('resume');
  frame.contentWindow?.postMessage({ type: 'design-terminal:case-presented' }, location.origin);
  if (panel?.contains(document.activeElement) === false || document.activeElement === panel)
    siteNavigation.focus();
}
function syncCaseLanguage() {
  const project = getProject(activeFrame?.dataset.projectId);
  if (project && panel) {
    panel.setAttribute('aria-label',t(`${project.title} 完整设计案例`,`${project.title} complete design case`));
  }
  if (activeFrame) interfaces.get(activeFrame)?.localize();
}
window.addEventListener('design-terminal:language',syncCaseLanguage);
document.addEventListener('visibilitychange', () => tellCase(document.hidden ? 'pause' : 'resume'));

function waitForDocument(frame: HTMLIFrameElement, signal: AbortSignal) {
  if (frame.dataset.loaded === 'true') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearInterval(poll);
      frame.removeEventListener('load', loaded);
      frame.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error('项目页面载入失败，请重试。')); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    // A model preload delays window.load. Attach the host as soon as the DOM
    // exists so a slow model can report progress instead of timing out unseen.
    const poll = window.setInterval(() => {
      try {
        const doc = frame.contentDocument;
        if (doc?.body && doc.URL !== 'about:blank' && doc.readyState !== 'loading') loaded();
      } catch { /* The load/error events handle a non-local response. */ }
    }, 100);
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

function bounded<T>(work: Promise<T>, signal: AbortSignal, progress?: () => string | undefined): Promise<T> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    let updated = started, previous = progress?.();
    const cleanup = () => { clearInterval(timer); signal.removeEventListener('abort', aborted); };
    const aborted = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = window.setInterval(() => {
      const now = performance.now(), current = progress?.();
      if (current !== previous) { previous = current; updated = now; }
      // Preserve the stalled-resource guard, but let an active download finish.
      if (now - updated < 25000 && now - started < 120000) return;
      cleanup(); reject(new Error('载入用时较长，请重试或返回项目选择。'));
    }, 500);
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
