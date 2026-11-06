import { loopingLogoSvg, RhineLogoPlayer } from './rhine-logo';
import type { ProjectDefinition } from './projects';
import './project-loading.css';
import {t,translatedText,localize} from './terminal-language';
import {PROJECT_ENTRY,projectEntryAt} from './project-entry-motion';

export class ProjectLoading {
  readonly root = document.createElement('section');
  private started = 0;
  private slowTimer = 0;
  private entryFrame = 0;
  private run = new AbortController();
  private logoPlayer: RhineLogoPlayer;
  constructor(private panel: HTMLDialogElement, retry: () => void, proceed: () => void) {
    this.root.className = 'case-loading';
    this.root.hidden = true;
    this.root.setAttribute('aria-label', '项目档案加载');
    this.root.innerHTML = `<div class="case-loading-grid" aria-hidden="true"></div><div class="case-loading-scanlines" aria-hidden="true"></div><div class="case-loading-content"><div class="case-loading-kicker">ANALYSIS OS / ARCHIVE ACCESS</div><div class="case-loading-optics" aria-hidden="true"><i></i><i></i><i></i><b>+</b><b>+</b><div>${loopingLogoSvg}</div></div><div class="case-loading-file"></div><h2>正在读取项目档案</h2><p class="case-loading-status" role="status" aria-live="polite"></p><div class="case-loading-track" aria-hidden="true"><i></i></div><ol class="case-loading-steps" aria-label="加载步骤"><li data-zh="01 / 档案读取" data-en="01 / CONNECT">01 / 档案读取</li><li data-zh="02 / 首屏准备" data-en="02 / PREPARE">02 / 首屏准备</li><li data-zh="03 / 确认访问" data-en="03 / ACCESS">03 / 确认访问</li></ol><div class="case-loading-actions"><button type="button" data-retry data-zh="重新载入 ↻" data-en="RETRY ↻" hidden>重新载入 ↻</button><button type="button" data-proceed data-zh="先查看页面 →" data-en="OPEN PAGE →" hidden>先查看页面 →</button></div></div><div class="case-loading-foot"><span>SESSION AUTHORIZED</span><span>DESIGN ARCHIVE / READ ONLY</span></div>`;
    this.root.querySelector('[data-retry]')!.addEventListener('click', retry);
    this.root.querySelector('[data-proceed]')!.addEventListener('click', proceed);
    panel.append(this.root);
    this.logoPlayer = new RhineLogoPlayer(this.root.querySelector<SVGSVGElement>('svg.rhine-logo')!);
    const scan=document.createElement('div');
    scan.className='case-entry-scan';scan.setAttribute('aria-hidden','true');
    scan.innerHTML='<i></i><span>ARCHIVE SCAN / ACCESS REQUEST</span>';
    panel.append(scan);
    window.addEventListener('design-terminal:language',()=>localize(this.root));
  }
  begin(project: ProjectDefinition, approach=false) {
    this.cancel();
    this.run = new AbortController();
    this.started = performance.now();
    this.root.hidden = false;
    this.logoPlayer.setActive(!approach);
    this.root.style.removeProperty('opacity');
    if(approach)this.root.style.opacity='0';
    this.panel.dataset.casePhase = approach ? 'approach' : 'loading';
    this.panel.setAttribute('aria-busy', 'true');
    this.root.querySelector('.case-loading-file')!.textContent = `FILE ${project.number} / ${project.title}`;
    this.root.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.hidden = true);
    this.setPhase('document', '正在连接项目档案，请稍候。');
    localize(this.root);
    if(approach) {
      document.documentElement.classList.add('case-approaching');
      window.dispatchEvent(new Event('design-terminal:case-approach'));
      const signal=this.run.signal;
      const entry=()=>{
        if(signal.aborted)return;
        const elapsed=(performance.now()-this.started)/1000;
        const cue=projectEntryAt(elapsed);
        this.logoPlayer.setActive(cue.loaderOpacity > 0);
        this.panel.style.setProperty('--entry-scan-y',`${cue.scan*100}%`);
        this.panel.dataset.entryScanning=String(cue.scan>0&&cue.scan<1);
        this.root.style.opacity=String(cue.loaderOpacity);
        if(elapsed>=PROJECT_ENTRY.approach && this.panel.dataset.casePhase==='approach'){
          this.panel.dataset.casePhase='loading';
          document.documentElement.classList.remove('case-approaching');
        }
        if(elapsed<PROJECT_ENTRY.approach+.18)this.entryFrame=requestAnimationFrame(entry);
        else this.root.style.removeProperty('opacity');
      };
      this.entryFrame=requestAnimationFrame(entry);
    }
    this.slowTimer = window.setTimeout(() => {
      if (!this.run.signal.aborted && this.root.dataset.phase !== 'failed') {
        this.status('资源仍在载入，准备完成后将自动进入。');
      }
    }, 8000);
    return this.run.signal;
  }
  preparing() { this.setPhase('assets', '档案已连接，正在准备首屏内容。'); }
  async reveal(signal: AbortSignal, partial = false) {
    clearTimeout(this.slowTimer);
    // A brief scan remains visible on cached opens; never invent a percentage.
    const minimum = matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : PROJECT_ENTRY.minimum*1000;
    await pause(Math.max(0, minimum - (performance.now() - this.started)), signal);
    if (signal.aborted) return;
    this.setPhase('ready', partial ? '正在打开页面，可在项目内重试未就绪的资源。' : '档案已就绪，正在进入项目。');
    await pause(matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : PROJECT_ENTRY.confirm*1000, signal);
    if (signal.aborted) return;
    this.panel.dataset.casePhase = 'revealing';
    this.logoPlayer.setActive(false);
    this.panel.setAttribute('aria-busy', 'false');
    await pause(matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : PROJECT_ENTRY.fade*1000, signal);
    if (signal.aborted) return;
    this.panel.dataset.casePhase = 'open';
    this.root.hidden = true;
    this.logoPlayer.setActive(false);
  }
  fail(message: string, canProceed: boolean) {
    this.logoPlayer.setActive(true);
    clearTimeout(this.slowTimer);
    cancelAnimationFrame(this.entryFrame);
    this.root.style.removeProperty('opacity');
    document.documentElement.classList.remove('case-approaching');
    this.panel.dataset.casePhase='loading';
    this.panel.setAttribute('aria-busy', 'false');
    this.setPhase('failed', message);
    this.root.querySelector<HTMLButtonElement>('[data-retry]')!.hidden = false;
    this.root.querySelector<HTMLButtonElement>('[data-proceed]')!.hidden = !canProceed;
  }
  cancel() {
    this.logoPlayer.setActive(false);
    this.run.abort();
    clearTimeout(this.slowTimer);
    cancelAnimationFrame(this.entryFrame);
    this.root.style.removeProperty('opacity');
    document.documentElement.classList.remove('case-approaching');
    window.dispatchEvent(new Event('design-terminal:case-return'));
    this.root.hidden = true;
    this.panel.removeAttribute('aria-busy');
    this.panel.style.removeProperty('--entry-scan-y');
    delete this.panel.dataset.entryScanning;
  }
  private setPhase(phase: string, text: string) {
    this.root.dataset.phase = phase;
    translatedText(this.root.querySelector('h2')!,phase === 'ready' ? 'ACCESS CONFIRMED' : phase === 'failed' ? '档案载入未完成' : '正在读取项目档案',phase === 'ready' ? 'ACCESS CONFIRMED' : phase === 'failed' ? 'ARCHIVE NOT READY' : 'READING PROJECT ARCHIVE');
    this.status(text);
  }
  private status(text: string) {
    const english: Record<string,string>={
      '正在连接项目档案，请稍候。':'Connecting to the project archive.',
      '档案已连接，正在准备首屏内容。':'Archive connected. Preparing the first view.',
      '资源仍在载入，准备完成后将自动进入。':'Resources are still loading. The project will open when ready.',
      '档案已就绪，正在进入项目。':'Access confirmed. Opening project archive.',
      '正在打开页面，可在项目内重试未就绪的资源。':'Opening the page. Unavailable resources can be retried inside.',
      '三维模型暂未载入，可重试或先查看项目页面。':'The 3D model could not load. Retry or open the project page.',
      '载入用时较长，请重试或返回项目选择。':'Loading is taking longer. Retry or return to collections.',
      '项目页面暂时无法打开，请重试。':'The project page could not open. Please retry.',
      '项目页面载入失败，请重试。':'The project page failed to load. Please retry.',
    };
    translatedText(this.root.querySelector('.case-loading-status')!,text,english[text]??'The archive is not ready. Please retry.');
  }
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = window.setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}
