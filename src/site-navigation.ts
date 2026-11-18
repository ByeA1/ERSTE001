import './site-navigation.css';
import { projects, type ProjectDefinition } from './projects';
import { languageControls, localize, t } from './terminal-language';

class SiteNavigation {
  readonly root = document.createElement('nav');
  private readonly toggle: HTMLButtonElement;
  private readonly menu: HTMLElement;
  private readonly close: HTMLButtonElement;
  private readonly projectLinks: HTMLElement;
  private timer = 0;
  private compact = matchMedia('(max-width:640px), (pointer:coarse) and (orientation:portrait) and (max-width:1000px)');
  private switchProject?: (id: string) => void;
  private back?: () => void;

  constructor() {
    this.root.className = 'site-navigation';
    this.root.tabIndex = -1;
    this.root.innerHTML = `<div class="site-nav-profile"><strong>albert_z0413@hotmail.com</strong><span>Product Design · 2026</span></div>
      <strong class="site-nav-project"></strong>
      <div class="site-nav-meta"><span>Product Design</span><span>2026</span></div>
      <button class="site-nav-toggle" type="button" aria-controls="site-nav-menu"><span aria-hidden="true" class="site-nav-glyph">☰</span><b></b></button>
      <div class="site-nav-language">${languageControls()}</div>
      <button type="button" class="project-case-close"><span class="action-icon" aria-hidden="true">←</span><span class="action-label" data-zh="返回终端" data-en="Back to terminal">返回终端</span></button>
      <div id="site-nav-menu" class="site-nav-menu" hidden>
        <div class="site-nav-links"></div><div class="site-nav-menu-meta"></div>
      </div>`;
    this.toggle = this.root.querySelector('.site-nav-toggle')!;
    this.menu = this.root.querySelector('.site-nav-menu')!;
    this.close = this.root.querySelector('.project-case-close')!;
    this.projectLinks = this.root.querySelector('.site-nav-links')!;
    for (const project of projects.filter(item => item.page && item.shortcut !== false)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.navProject = project.id;
      button.textContent = project.title;
      button.addEventListener('click', () => this.switchProject?.(project.id));
      this.projectLinks.append(button);
    }
    this.close.addEventListener('click', () => this.back?.());
    this.toggle.addEventListener('click', () => this.expand(this.menu.hidden));
    this.root.addEventListener('pointerenter', () => clearTimeout(this.timer));
    this.root.addEventListener('pointerleave', () => this.schedule());
    this.root.addEventListener('focusin', () => clearTimeout(this.timer));
    this.root.addEventListener('focusout', () => this.schedule());
    this.root.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || this.menu.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      this.expand(false);
      this.toggle.focus({ preventScroll: true });
    });
    window.addEventListener('design-terminal:language', () => this.localize());
    this.compact.addEventListener('change',()=>{this.syncLayout();this.expand(false);});
    this.syncLayout();
    this.expand(false);
  }

  private syncLayout() {
    const profile=this.root.querySelector<HTMLElement>('.site-nav-profile')!;
    const language=this.root.querySelector<HTMLElement>('.site-nav-language')!;
    if(this.compact.matches)this.root.querySelector('.site-nav-menu-meta')!.append(profile,language);
    else {this.root.prepend(profile);this.root.insertBefore(language,this.close);}
  }

  hideProject() {
    this.root.remove();
    this.expand(false);
  }

  showProject(panel: HTMLElement, project: ProjectDefinition, select: (id: string) => void, back: () => void) {
    this.switchProject = select;
    this.back = back;
    this.root.dataset.theme = project.navigationTheme ?? 'light';
    this.root.querySelector('.site-nav-project')!.textContent=project.title;
    this.projectLinks.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      const current = button.dataset.navProject === project.id;
      button.disabled = current;
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    panel.prepend(this.root);
    this.expand(false);
  }

  focus() { this.root.focus({ preventScroll: true }); }

  private expand(open: boolean) {
    this.menu.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
    this.localize();
    this.schedule();
  }

  private schedule() {
    clearTimeout(this.timer);
    if (this.menu.hidden) return;
    this.timer = window.setTimeout(() => {
      if (!this.menu.contains(document.activeElement) &&
        !(matchMedia('(hover: hover)').matches && this.root.matches(':hover'))) this.expand(false);
    }, 4500);
  }

  private localize() {
    this.root.setAttribute('aria-label', t('站点导航', 'Site navigation'));
    const collapsed = this.menu.hidden;
    this.toggle.setAttribute('aria-label', collapsed ? t('展开作品集', 'Expand portfolio') : t('收起作品集', 'Collapse portfolio'));
    this.toggle.querySelector('b')!.textContent = t('作品集', 'Portfolio');
    localize(this.root);
  }
}

export const siteNavigation = new SiteNavigation();
