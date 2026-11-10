import './site-navigation.css';
import { projects, type ProjectDefinition } from './projects';
import { languageControls, localize, t } from './terminal-language';

class SiteNavigation {
  readonly root = document.createElement('nav');
  private readonly toggle: HTMLButtonElement;
  private readonly menu: HTMLElement;
  private readonly profile: HTMLElement;
  private readonly metadata: HTMLElement;
  private readonly language: HTMLElement;
  private readonly close: HTMLButtonElement;
  private readonly projectLinks: HTMLElement;
  private readonly name: HTMLElement;
  private timer = 0;
  private current?: ProjectDefinition;
  private terminal?: HTMLElement;
  private terminalTools?: HTMLElement;
  private switchProject?: (id: string) => void;
  private back?: () => void;

  constructor() {
    this.root.className = 'site-navigation';
    this.root.innerHTML = `<div class="site-nav-profile" hidden><strong>albert_z0413@hotmail.com</strong><span>Product Design · 2026</span></div>
      <div class="site-nav-meta" hidden><span>Product Design</span><span>2026</span></div>
      <button class="site-nav-toggle" type="button" aria-controls="site-nav-menu"><span aria-hidden="true" class="site-nav-glyph">☰</span><b></b></button>
      <button type="button" class="project-case-close" hidden><span aria-hidden="true">←</span><span data-zh="返回终端" data-en="Back to terminal">返回终端</span></button>
      <div id="site-nav-menu" class="site-nav-menu" hidden>
        <div class="site-nav-language">${languageControls()}</div>
        <div class="site-nav-links" hidden></div>
      </div>`;
    this.toggle = this.root.querySelector('.site-nav-toggle')!;
    this.menu = this.root.querySelector('.site-nav-menu')!;
    this.profile = this.root.querySelector('.site-nav-profile')!;
    this.metadata = this.root.querySelector('.site-nav-meta')!;
    this.language = this.root.querySelector('.site-nav-language')!;
    this.close = this.root.querySelector('.project-case-close')!;
    this.projectLinks = this.root.querySelector('.site-nav-links')!;
    this.name = this.toggle.querySelector('b')!;
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
    this.expand(false);
  }

  mountTerminal(stage: HTMLElement, tools: HTMLElement) {
    this.terminal = stage;
    this.terminalTools = tools;
    this.menu.append(tools);
    this.showTerminal();
  }

  showTerminal() {
    if (!this.terminal) return;
    this.current = undefined;
    this.root.dataset.theme = 'terminal';
    this.profile.hidden = this.metadata.hidden = this.close.hidden = this.projectLinks.hidden = true;
    this.menu.prepend(this.language);
    this.terminalTools!.hidden = false;
    this.terminal.append(this.root);
    this.expand(false);
  }

  showProject(panel: HTMLElement, project: ProjectDefinition, select: (id: string) => void, back: () => void) {
    this.current = project;
    this.switchProject = select;
    this.back = back;
    this.root.dataset.theme = project.navigationTheme ?? 'light';
    this.profile.hidden = this.metadata.hidden = this.close.hidden = this.projectLinks.hidden = false;
    this.close.before(this.language);
    if (this.terminalTools) this.terminalTools.hidden = true;
    this.projectLinks.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      const current = button.dataset.navProject === project.id;
      button.disabled = current;
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    panel.prepend(this.root);
    this.expand(false);
  }

  focus() { (this.current ? this.close : this.toggle).focus({ preventScroll: true }); }

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
    this.toggle.setAttribute('aria-label', this.current
      ? (collapsed ? t('展开作品集', 'Expand portfolio') : t('收起作品集', 'Collapse portfolio'))
      : (collapsed ? t('展开导航', 'Expand navigation') : t('收起导航', 'Collapse navigation')));
    this.name.textContent = this.current ? t('作品集', 'Portfolio') : 'ANALYSIS OS';
    localize(this.root);
  }
}

export const siteNavigation = new SiteNavigation();
