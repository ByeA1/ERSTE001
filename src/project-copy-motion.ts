import { createRollingText, type RollingTextController } from '@kitlangton/rolling-number';
import './project-copy-motion.css';

type PendingCopy = { element: HTMLElement; previous: string; text: string };

/** Reuse the terminal glyph reels, one native wrapped line at a time. */
export class ProjectCopyMotion {
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private values = new Map<string, string>();
  private pending = new Map<string, PendingCopy>();
  private active = new Map<HTMLElement, () => void>();
  private starts = new Map<HTMLElement, () => void>();

  update(key: string, element: HTMLElement, animated: boolean) {
    const text = element.textContent ?? '';
    const previous = this.values.get(key);
    this.values.set(key, text);
    this.pending.delete(key);
    if (animated && !this.reduced.matches && previous && previous !== text)
      this.pending.set(key, { element, previous, text });
  }

  /** Called by the existing terminal frame, after the cassette/document reveal. */
  reveal(ready: boolean) {
    if (this.reduced.matches) {
      this.finish();
      return;
    }
    if (!ready) return;
    for (const [key, copy] of this.pending) {
      this.pending.delete(key);
      if (copy.element.isConnected) this.roll(copy);
    }
    for (const start of this.starts.values()) start();
  }

  finish() {
    this.pending.clear();
    for (const cleanup of [...this.active.values()]) cleanup();
  }

  private roll({ element, previous, text }: PendingCopy) {
    this.active.get(element)?.();
    const bounds = element.getBoundingClientRect();
    const scale = bounds.width / element.offsetWidth;
    if (!scale || !element.clientWidth) return;
    const color = getComputedStyle(element).color;
    // Measure browser line breaks, including CJK, punctuation and font shaping.
    // Native text stays in flow and remains the only accessible/selectable copy.
    const native = document.createElement('span');
    native.textContent = text;
    element.replaceChildren(native);
    element.classList.add('project-copy-rolling');
    const lines = (host: HTMLElement, node: Node = host.firstChild!) => {
      const origin = host.getBoundingClientRect();
      const rows: { text: string; x: number; y: number; height: number }[] = [];
      let offset = 0;
      for (const character of node.textContent ?? '') {
        const range = document.createRange();
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        const y = (rect.top - origin.top) / scale;
        let row = rows.find(row => Math.abs(row.y - y) < 2);
        if (!row) {
          row = { text: '', x: (rect.left - origin.left) / scale, y, height: rect.height / scale };
          rows.push(row);
        }
        row.text += character;
      }
      return rows;
    };
    // Use the full paragraph box as origin, rather than the inline span's box.
    const nextLines = lines(element, native.firstChild!);
    const old = document.createElement('span');
    old.className = 'project-copy-measure';
    old.textContent = previous;
    old.setAttribute('aria-hidden', 'true');
    element.append(old);
    const oldLines = lines(old);
    old.remove();
    const overlay = document.createElement('span');
    overlay.className = 'project-copy-reels';
    overlay.style.color = color;
    overlay.setAttribute('aria-hidden', 'true');
    const controllers: RollingTextController[] = [];
    const reels: HTMLElement[] = [];
    for (let index = 0; index < nextLines.length; index++) {
      const line = nextLines[index];
      const clip = document.createElement('span');
      clip.className = 'project-copy-line';
      clip.style.cssText = `left:${line.x}px;top:${line.y}px;height:${line.height}px;line-height:${line.height}px`;
      const reel = document.createElement('span');
      clip.append(reel);
      overlay.append(clip);
      // Mount before measurement: the terminal itself can be scaled/projected.
      element.append(overlay);
      const controller = createRollingText(reel, {
        text: oldLines[index]?.text ?? ' ', duration: 460, motionBlur: true,
        transition: 'direct', stagger: 'none', direction: 'up', animated: true,
        pauseOffscreen: false,
      });
      controllers.push(controller);
      reels.push(reel);
    }
    native.className = 'project-copy-native';
    const handoff: Animation[] = [];
    const cleanup = () => {
      clearTimeout(timer);
      handoff.forEach(animation => animation.cancel());
      controllers.forEach(controller => controller.destroy());
      overlay.remove();
      // Restore the original simple DOM after motion, including selection/copy.
      element.replaceChildren(document.createTextNode(text));
      element.classList.remove('project-copy-rolling');
      this.active.delete(element);
      this.starts.delete(element);
    };
    // Let the shared scheduler measure/paint the old glyphs before retargeting.
    // An immediate update during construction would only paint the new value.
    let timer = window.setTimeout(cleanup, 2000);
    this.starts.set(element, () => {
      if (!reels.every(reel => reel.hasAttribute('data-rn-ready'))) return;
      this.starts.delete(element);
      controllers.forEach((controller, index) => controller.update({ text: nextLines[index].text, animated: true }));
      clearTimeout(timer);
      // Glyph reels cannot exactly reproduce native kerning/justification.
      // Hand back to the text already in its final layout while the reels settle,
      // then release the hidden controllers only after that handoff has finished.
      const timing: KeyframeAnimationOptions = {
        delay: 340, duration: 200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both',
      };
      const reveal = native.animate([{ opacity: 0 }, { opacity: 1 }], timing);
      handoff.push(reveal, overlay.animate([{ opacity: 1 }, { opacity: 0 }], timing));
      void reveal.finished.then(cleanup).catch(() => {});
    });
    this.active.set(element, cleanup);
  }
}
