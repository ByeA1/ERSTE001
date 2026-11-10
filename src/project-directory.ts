import { t } from "./terminal-language";
import "./project-directory.css";

type DirectoryScope = "collections" | "projects";
type DirectoryItem = { id: string; label: string; reserved?: boolean };

export function createProjectDirectory(
  host: HTMLElement,
  choose: (scope: DirectoryScope, id: string, open: boolean) => void,
) {
  const lists = {
    collections: host.querySelector<HTMLElement>('[data-directory-list="collections"]')!,
    projects: host.querySelector<HTMLElement>('[data-directory-list="projects"]')!,
  };
  const items = {
    collections: lists.collections.querySelector<HTMLElement>('.directory-items')!,
    projects: lists.projects.querySelector<HTMLElement>('.directory-items')!,
  };
  let scope: DirectoryScope = "collections";
  let lastWheel = 0, lastStep = -Infinity, delta = 0;
  let pressY: number | undefined;
  let suppressClickUntil = 0;
  const activeButton = () => items[scope].querySelector<HTMLButtonElement>('[aria-current]');
  const enabled = () => !host.closest('[inert]');

  function move(direction: number, edge = false) {
    const buttons = [...items[scope].querySelectorAll<HTMLButtonElement>('button')];
    const current = buttons.findIndex(button => button.hasAttribute('aria-current'));
    const index = edge ? (direction < 0 ? 0 : buttons.length - 1)
      : Math.max(0, Math.min(buttons.length - 1, current + direction));
    const button = buttons[index];
    if (button && index !== current) choose(scope, button.dataset.directoryId!, false);
  }

  host.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-directory-id]');
    if (button && enabled() && performance.now() >= suppressClickUntil)
      choose(scope, button.dataset.directoryId!, true);
  });
  host.addEventListener('wheel', event => {
    if (event.ctrlKey || !enabled() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    if (now - lastWheel > 180) delta = 0;
    lastWheel = now;
    delta += event.deltaY * (event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? 120 : 1);
    if (Math.abs(delta) < 35 || now - lastStep < 240) return;
    move(Math.sign(delta));
    delta = 0;
    lastStep = now;
  }, { passive: false });
  host.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) ||
        !enabled() || !(event.target as Element).closest('[data-directory-id]')) return;
    event.preventDefault();
    event.stopPropagation();
    move(event.key === 'ArrowUp' || event.key === 'Home' ? -1 : 1, event.key === 'Home' || event.key === 'End');
    activeButton()?.focus({ preventScroll: true });
  });
  host.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') pressY = event.clientY;
  });
  host.addEventListener('pointercancel', () => { pressY = undefined; });
  host.addEventListener('pointerup', event => {
    if (pressY === undefined) return;
    const movement = pressY - event.clientY;
    pressY = undefined;
    if (!enabled() || Math.abs(movement) < 18) return;
    suppressClickUntil = performance.now() + 350;
    move(Math.sign(movement));
  });

  return {
    sync(next: DirectoryScope, entries: DirectoryItem[], selected: string | undefined, animate: boolean, showBack: boolean) {
      scope = next;
      host.dataset.scope = scope;
      host.dataset.animate = String(animate);
      host.setAttribute('aria-label', scope === 'collections'
        ? t('档案集目录', 'Archive collections') : t('项目目录', 'Projects in this collection'));
      lists.collections.inert = scope !== 'collections';
      lists.projects.inert = scope !== 'projects';
      host.querySelector<HTMLButtonElement>('.directory-back')!.hidden = !showBack;
      const list = items[scope];
      const buttons = [...list.querySelectorAll<HTMLButtonElement>('button')];
      if (buttons.length !== entries.length || buttons.some((button, index) => button.dataset.directoryId !== entries[index].id)) {
        list.replaceChildren(...entries.map(({ id }, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.directoryId = id;
          const number = document.createElement('span');
          number.className = 'directory-number';
          number.textContent = String(index + 1).padStart(2, '0');
          number.setAttribute('aria-hidden', 'true');
          const label = document.createElement('span');
          label.className = 'directory-label';
          button.append(number, label);
          return button;
        }));
      }
      [...list.querySelectorAll<HTMLButtonElement>('button')].forEach((button, index) => {
        const { id, label, reserved } = entries[index];
        button.lastElementChild!.textContent = label;
        button.setAttribute('aria-label', label);
        button.classList.toggle('directory-reserved', Boolean(reserved));
        if (id === selected) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    },
    focus() { activeButton()?.focus({ preventScroll: true }); },
  };
}
