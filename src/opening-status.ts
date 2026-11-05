/** Real resource feedback; authorization and welcome belong to the timeline. */
import {t,translatedText} from './terminal-language';
export type OpeningGroup = 'archive' | 'fonts';
const LABEL: Record<OpeningGroup,string> = { archive:'三维档案', fonts:'开屏字体' };
const GROUP_COUNT = Object.keys(LABEL).length;
export class OpeningStatus {
  private done = new Set<OpeningGroup>();
  private failed = new Set<OpeningGroup>();
  private startedAt = performance.now();
  private forced = false;
  private lastText = '';
  readonly root: HTMLElement;
  constructor(host: HTMLElement) {
    this.root=document.createElement('div'); this.root.className='opening-status';
    this.root.innerHTML=`<div class="opening-task" data-task role="status" aria-live="polite"></div><div class="opening-meta"><span data-count></span><span data-clock></span></div><button type="button" data-light hidden>进入轻量模式 →</button>`;
    host.append(this.root);
    this.root.querySelector('[data-light]')!.addEventListener('click',()=>{this.chooseLightweight();});
    this.render();
    window.addEventListener('design-terminal:language',()=>this.render());
  }
  reset(){this.done.clear();this.failed.clear();this.forced=false;this.startedAt=performance.now();this.lastText='';this.render();}
  fail(group:OpeningGroup){if(!this.done.has(group))this.failed.add(group);this.render();}
  complete(group:OpeningGroup){this.done.add(group);this.failed.delete(group);this.render();}
  chooseLightweight(){this.forced=true;this.render();}
  get forcedMode(){return this.forced;}
  get isReady(){return this.forced||this.done.size===GROUP_COUNT;}
  get elapsedSeconds(){return (performance.now()-this.startedAt)/1000;}
  update(){this.render();}
  private render(){
    const task=this.root.querySelector<HTMLElement>('[data-task]')!;
    const pending=(Object.keys(LABEL) as OpeningGroup[]).filter(g=>!this.done.has(g));
    const failed=pending.filter(g=>this.failed.has(g));
    const elapsed=Math.floor(this.elapsedSeconds);
    const labels=(groups:OpeningGroup[])=>groups.map(g=>t(LABEL[g],g==='archive'?'3D archive':'fonts')).join(t('、',', '));
    const text=this.forced?t('已选择轻量模式','LIGHTWEIGHT MODE'):failed.length?t(`${labels(failed)}加载失败 · 可先进入轻量模式`,`${labels(failed)} unavailable · Lightweight mode is available`):this.isReady?t('档案资源已就绪','ARCHIVE RESOURCES READY'):elapsed>=3?t(`正在载入${labels(pending)}`,`Loading ${labels(pending)}`):t('正在准备档案','Preparing archive');
    if(text!==this.lastText){task.textContent=text;this.lastText=text;}
    this.root.querySelector('[data-count]')!.textContent=t(`资源已就绪 ${this.done.size}/${GROUP_COUNT} 项`,`Resources ready ${this.done.size}/${GROUP_COUNT}`);
    this.root.querySelector('[data-clock]')!.textContent=!this.isReady&&elapsed>=3?t(`已等待 ${elapsed} 秒`,`Waiting ${elapsed}s`):'';
    translatedText(this.root.querySelector('[data-light]')!,'进入轻量模式 →','ENTER LIGHTWEIGHT MODE →');
    this.root.querySelector<HTMLButtonElement>('[data-light]')!.hidden=this.isReady||(!failed.length&&elapsed<12);
    this.root.dataset.count=String(this.done.size);this.root.dataset.failed=failed.join(',');
  }
  destroy(){this.root.remove();}
}
