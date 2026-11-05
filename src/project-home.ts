import { projects } from './projects';
import { escapeHtml } from './html';
import './project-home.css';

const home = document.createElement('section');
home.className = 'project-home';
home.hidden = true;
home.setAttribute('aria-label', '项目展示板');
home.innerHTML = `
  <div class="home-top"><div class="home-brand"><strong>albert_z0413@hotmail.com</strong><span>INDEPENDENT PRODUCT DESIGN</span><small>DESIGN TERMINAL / 2026</small></div><nav aria-label="项目导航">${projects.map(p=>`<button data-home-select="${escapeHtml(p.id)}" aria-pressed="${p.id===projects[0].id}">${escapeHtml(p.title)}</button>`).join('')}</nav></div>
  <div class="home-heading"><span>SELECTED WORK / 产品设计</span><p>从使用体验，到结构与实体。</p></div>
  <div class="project-boards">${projects.map(p=>`<article class="project-board" data-board="${escapeHtml(p.id)}"><div class="board-topline"><span>PROJECT / ${escapeHtml(p.number)}</span><span>${escapeHtml(p.status??'DESIGN ARCHIVE')}</span></div><div class="board-visual">${p.preview?`<iframe data-preview="${escapeHtml(p.preview)}" title="${escapeHtml(p.title)} 模型预览" tabindex="-1" aria-hidden="true"></iframe>`:p.cover?`<img src="${escapeHtml(p.cover)}" alt="${escapeHtml(p.title)} 项目主视觉">`:''}<i class="board-crosshair" aria-hidden="true">+</i></div><div class="board-caption"><div><h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.subtitle??'PRODUCT DESIGN')}</p></div><span class="board-arrow" aria-hidden="true">↗</span></div><div class="board-summary">${escapeHtml(p.summary??'')}</div><i class="board-screw screw-a" aria-hidden="true"></i><i class="board-screw screw-b" aria-hidden="true"></i><button class="board-open" data-project="${escapeHtml(p.id)}" aria-label="打开 ${escapeHtml(p.title)} 项目"></button></article>`).join('')}</div>
  <footer class="home-footer"><span><i></i> PORTFOLIO / ${String(projects.length).padStart(2,'0')} PROJECTS</span><span>DESIGN · MODEL · PROTOTYPE</span><button data-action="replay">重播开场 ↻</button></footer>`;
document.body.append(home);
let visible = false;
export function projectHomeVisible() { return visible; }
export function setProjectHomeVisible(value: boolean) {
  if (value === visible) return;
  visible = value;
  home.hidden = !value;
  home.inert = !value;
  document.documentElement.classList.toggle('project-home-active', value);
  document.getElementById('viewport')!.inert = value;
  if (value) {
    home.querySelectorAll<HTMLIFrameElement>('iframe[data-preview]').forEach(frame=>{
      if (!frame.hasAttribute('src')) frame.src=frame.dataset.preview!;
    });
  }
}
home.addEventListener('click', event=>{
  const button=(event.target as Element).closest<HTMLElement>('[data-home-select]');
  if(!button) return;
  const id=button.dataset.homeSelect;
  home.querySelectorAll<HTMLElement>('[data-home-select]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.homeSelect===id)));
  home.querySelectorAll<HTMLElement>('[data-board]').forEach(el=>el.classList.toggle('board-selected',el.dataset.board===id));
  const card=[...home.querySelectorAll<HTMLElement>('[data-board]')].find(el=>el.dataset.board===id);
  if (matchMedia('(max-width: 700px)').matches) card?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'});
});
