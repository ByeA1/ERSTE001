import { t } from "./terminal-language";
import type { ProjectDefinition } from "./projects";

/** A bounded vertical selector: wheel, touch swipe, keyboard and direct selection. */
export function createProjectDirectory(
  host: HTMLElement,
  projects: ProjectDefinition[],
  choose: (id: string) => void,
) {
  let current = 0,
    total = 0,
    last = 0,
    lastWheel = 0,
    pressY: number | undefined,
    suppressClick = false;
  const buttons = [
    ...host.querySelectorAll<HTMLButtonElement>("[data-showcase-project]"),
  ];
  const enabled = () =>
    !host.closest("[inert]") &&
    host.closest("#stage")?.getAttribute("data-mode") !== "boot";
  function step(direction: number) {
    if (!enabled()) return;
    const next = Math.max(
      0,
      Math.min(projects.length - 1, current + direction),
    );
    if (next !== current) choose(projects[next].id);
  }
  host.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || !enabled() || Math.abs(e.deltaX) > Math.abs(e.deltaY))
        return;
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastWheel > 180) total = 0;
      lastWheel = now;
      total +=
        e.deltaY * (e.deltaMode === 1 ? 24 : e.deltaMode === 2 ? 120 : 1);
      if (Math.abs(total) < 35 || now - last < 240) return;
      step(Math.sign(total));
      total = 0;
      last = now;
    },
    { passive: false },
  );
  host.addEventListener("keydown", (e) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key) || !enabled())
      return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Home") choose(projects[0].id);
    else if (e.key === "End") choose(projects.at(-1)!.id);
    else step(e.key === "ArrowDown" ? 1 : -1);
    buttons[current]?.focus({ preventScroll: true });
  });
  host.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") pressY = e.clientY;
  });
  host.addEventListener("pointercancel", () => {
    pressY = undefined;
  });
  host.addEventListener("pointerup", (e) => {
    if (pressY === undefined) return;
    const delta = pressY - e.clientY;
    pressY = undefined;
    if (Math.abs(delta) < 18) return;
    e.preventDefault();
    suppressClick = true;
    step(Math.sign(delta));
    setTimeout(() => (suppressClick = false), 350);
  });
  host.addEventListener(
    "click",
    (e) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  return {
    sync(id?: string) {
      const active = projects.findIndex((p) => p.id === id);
      current = active < 0 ? 0 : active;
      host.style.setProperty("--directory-index", String(current));
      host.setAttribute(
        "aria-label",
        t("滚轮项目目录", "Scroll project directory"),
      );
      buttons.forEach((button, i) => {
        button.classList.toggle("directory-current", i === active);
        if (i === active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    },
  };
}
