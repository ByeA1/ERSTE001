import { t } from "./terminal-language";
import type { ProjectDefinition } from "./projects";
import {
  createRollingText,
  type MotionOptions,
} from "@kitlangton/rolling-number";

/** A bounded vertical selector: wheel, touch swipe, keyboard and direct selection. */
export function createProjectDirectory(
  host: HTMLElement,
  projects: ProjectDefinition[],
  choose: (id: string) => void,
  motion: MotionOptions = {},
) {
  let current = 0,
    total = 0,
    last = 0,
    lastWheel = 0,
    pressY: number | undefined,
    suppressClick = false;
  let available: ProjectDefinition[] = [];
  const track = host.querySelector<HTMLElement>(".directory-track")!;
  // Fixed previous/current/next slots use the same glyph movement as the site
  // captions, rather than translating a second, independent list animation.
  const slots = Array.from({ length: 3 }, () => {
    const row = document.createElement("div");
    row.className = "directory-slot";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-shortcut directory-project";
    button.hidden = true;
    const number = document.createElement("small");
    const title = document.createElement("span");
    const arrow = document.createElement("i");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    button.append(number, title, arrow);
    row.append(button);
    const options = {
      ...motion,
      text: "",
      animated: false,
      transition: "direct" as const,
      stagger: "none" as const,
    };
    return {
      row,
      button,
      number: createRollingText(number, options),
      title: createRollingText(title, options),
    };
  });
  track.replaceChildren(...slots.map((slot) => slot.row));
  const enabled = () =>
    !host.hidden &&
    available.length > 0 &&
    !host.closest("[inert]") &&
    host.closest("#stage")?.getAttribute("data-mode") !== "boot";
  function step(direction: number) {
    if (!enabled()) return;
    const next = Math.max(
      0,
      Math.min(available.length - 1, current + direction),
    );
    if (next !== current) choose(available[next].id);
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
    if (e.key === "Home") choose(available[0].id);
    else if (e.key === "End") choose(available.at(-1)!.id);
    else step(e.key === "ArrowDown" ? 1 : -1);
    slots[1].button.focus({ preventScroll: true });
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
    sync(
      id: string | undefined,
      projectIds: readonly string[],
      animated = true,
    ) {
      const allowed = new Set(projectIds);
      available = projects.filter((project) => allowed.has(project.id));
      const active = available.findIndex((p) => p.id === id);
      const previous = current;
      current = active < 0 ? 0 : active;
      host.hidden = available.length === 0;
      host.setAttribute(
        "aria-label",
        t("当前项目集的项目", "Projects in this collection"),
      );
      slots.forEach((slot, i) => {
        const index = current + i - 1;
        const project = available[index];
        const { button, number, title } = slot;
        button.hidden = !project;
        button.disabled = !project;
        button.classList.toggle(
          "directory-current",
          Boolean(project) && index === active,
        );
        if (project) {
          button.dataset.showcaseProject = project.id;
          button.setAttribute("aria-label", project.title);
        } else {
          delete button.dataset.showcaseProject;
          button.removeAttribute("aria-label");
        }
        if (project && index === active)
          button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
        const direction =
          current < previous ? ("down" as const) : ("up" as const);
        number.update({
          text: project ? String(index + 1).padStart(2, "0") : "",
          animated: animated && Boolean(project),
          direction,
        });
        title.update({
          text: project?.title ?? "",
          animated: animated && Boolean(project),
          direction,
        });
        if (!animated || !project) {
          number.finish();
          title.finish();
        }
      });
    },
  };
}
