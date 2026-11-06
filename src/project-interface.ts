import {
  loopingMarkSvg,
  RhineLogoPlayer,
  getRhineLogoPolicy,
} from "./rhine-logo";
import logoCss from "./rhine-logo.css?inline";
import {
  currentLanguage,
  setTerminalLanguage,
  type TerminalLanguage,
} from "./terminal-language";

/** Default host services for every registered same-origin project, including
 * future projects. Project pages supply content, not copies of host UI code. */
export class ProjectInterface {
  private logos = new Map<SVGSVGElement, RhineLogoPlayer>();
  private paused = new Set<Animation>();
  private active = false;
  private events = new AbortController();
  private observer: MutationObserver;
  private quality?: MutationObserver;
  private lastPolicy = "";
  readonly document: Document;
  private policyChanged = () => this.applyPolicy();
  private media = matchMedia("(prefers-reduced-motion: reduce)");
  constructor(
    private frame: HTMLIFrameElement,
    private close: () => void,
  ) {
    this.document = frame.contentDocument!;
    const doc = this.document;
    const style = doc.createElement("style");
    style.dataset.terminalInterface = "true";
    style.textContent =
      logoCss +
      '\nhtml[data-terminal-motion="reduced"] *,html[data-terminal-motion="reduced"] *::before,html[data-terminal-motion="reduced"] *::after{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important;scroll-behavior:auto!important;}';
    doc.head.append(style);
    doc.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        if (target.closest("[data-project-close]")) {
          event.preventDefault();
          this.close();
          return;
        }
        const control = target.closest<HTMLElement>(
          "[data-language],[data-terminal-language]",
        );
        const language =
          control?.dataset.language ?? control?.dataset.terminalLanguage;
        if (
          (language === "zh" || language === "en") &&
          language !== currentLanguage()
        )
          setTerminalLanguage(language);
      },
      { signal: this.events.signal },
    );
    doc.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          this.close();
        }
      },
      { signal: this.events.signal },
    );
    this.observer = new MutationObserver((records) => {
      // The 002 renderer writes text every frame. Only structural element edits
      // require a scan, never caption text or renderer attribute updates.
      if (
        !records.some((record) =>
          [...record.addedNodes, ...record.removedNodes].some(
            (node) => node.nodeType === 1,
          ),
        )
      )
        return;
      this.mountLogos();
      this.localize();
      this.applyPolicy();
      if (!this.active) this.setActive(false);
    });
    this.observer.observe(doc.body, { childList: true, subtree: true });
    const qualityHost = document.getElementById("three-scene");
    if (qualityHost) {
      this.quality = new MutationObserver(this.policyChanged);
      this.quality.observe(qualityHost, {
        attributes: true,
        attributeFilter: ["data-adaptive-tier"],
      });
    }
    window.addEventListener(
      "design-terminal:interface-policy",
      this.policyChanged,
    );
    this.media.addEventListener?.("change", this.policyChanged);
    this.mountLogos();
    this.applyPolicy();
  }
  private mountLogos() {
    const doc = this.document;
    for (const [svg, player] of this.logos)
      if (!doc.contains(svg)) {
        player.destroy();
        this.logos.delete(svg);
      }
    doc.querySelectorAll<HTMLElement>("[data-rhine-logo]").forEach((host) => {
      if (!host.querySelector("svg.rhine-logo"))
        host.innerHTML = loopingMarkSvg;
    });
    doc.querySelectorAll<SVGSVGElement>("svg.rhine-logo").forEach((svg) => {
      if (this.logos.has(svg)) return;
      const player = new RhineLogoPlayer(svg);
      this.logos.set(svg, player);
      player.setActive(this.active);
    });
  }
  localize(language: TerminalLanguage = currentLanguage()) {
    const doc = this.document;
    // Keep legacy pages' own rich-content translator and renderer untouched.
    // All pages receive the same protocol; no project-ID branches are needed.
    this.frame.contentWindow?.postMessage(
      { type: "design-terminal:case-language", language },
      location.origin,
    );
    const native = doc.querySelector<HTMLButtonElement>(
      `[data-language="${language}"]`,
    );
    if (native && native.getAttribute("aria-pressed") !== "true")
      native.click();
    if (!doc.querySelector("[data-i18n-page]")) {
      doc
        .querySelectorAll<HTMLElement>("[data-zh][data-en]")
        .forEach((node) => {
          const text = language === "zh" ? node.dataset.zh! : node.dataset.en!;
          if (node.textContent !== text) node.textContent = text;
        });
    }
    doc
      .querySelectorAll<HTMLElement>("[data-aria-zh][data-aria-en]")
      .forEach((node) =>
        node.setAttribute(
          "aria-label",
          language === "zh" ? node.dataset.ariaZh! : node.dataset.ariaEn!,
        ),
      );
    doc
      .querySelectorAll<HTMLElement>("[data-terminal-language]")
      .forEach((node) =>
        node.setAttribute(
          "aria-pressed",
          String(node.dataset.terminalLanguage === language),
        ),
      );
    doc.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }
  private applyPolicy() {
    const policy = getRhineLogoPolicy();
    const reduced = policy.reduced || this.media.matches;
    const tier = policy.low
      ? "low"
      : (document.getElementById("three-scene")?.dataset.adaptiveTier ??
        "high");
    this.logos.forEach((player) => player.setLow(tier === "low"));
    const signature = `${reduced}:${tier}`;
    if (signature === this.lastPolicy) return;
    this.lastPolicy = signature;
    this.document.documentElement.dataset.terminalMotion = reduced
      ? "reduced"
      : "full";
    this.document.documentElement.dataset.terminalQuality = tier;
    this.frame.contentWindow?.postMessage(
      { type: "design-terminal:case-policy", reduced, tier },
      location.origin,
    );
  }
  setActive(active: boolean) {
    this.active = active;
    this.logos.forEach((player) => player.setActive(active));
    if (!active) {
      for (const animation of this.document.getAnimations?.() ?? [])
        if (animation.playState === "running") {
          animation.pause();
          this.paused.add(animation);
        }
    } else {
      for (const animation of this.paused)
        if (animation.playState === "paused") animation.play();
      this.paused.clear();
      this.localize();
      this.applyPolicy();
    }
  }
  destroy() {
    this.events.abort();
    this.observer.disconnect();
    this.quality?.disconnect();
    this.logos.forEach((player) => player.destroy());
    this.logos.clear();
    this.paused.clear();
    window.removeEventListener(
      "design-terminal:interface-policy",
      this.policyChanged,
    );
    this.media.removeEventListener?.("change", this.policyChanged);
  }
}

/** Optional asynchronous model/content readiness; ordinary template pages need
 * no bootstrap JS. Custom engines declare loading before starting their work. */
export function waitForProjectReady(
  doc: Document,
  signal: AbortSignal,
): Promise<void> {
  if (doc.body.dataset.projectReady === "failed")
    return Promise.reject(new Error("项目内容暂未载入，可重试。"));
  if (doc.body.dataset.projectReady !== "loading") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const clean = () => {
      observer.disconnect();
      signal.removeEventListener("abort", aborted);
    };
    const aborted = () => {
      clean();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const observer = new MutationObserver(() => {
      const state = doc.body.dataset.projectReady;
      if (state === "ready") {
        clean();
        resolve();
      } else if (state === "failed") {
        clean();
        reject(new Error("项目内容暂未载入，可重试。"));
      }
    });
    observer.observe(doc.body, {
      attributes: true,
      attributeFilter: ["data-project-ready"],
    });
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}
