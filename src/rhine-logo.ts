import { bootMarkContour } from "./brand";
import { bootLogoTrack } from "./boot-logo-tracks";
import "./rhine-logo.css";

export const LOGO_PERIOD_MS = 6400;
export type LogoMode = "full" | "light" | "still";
// Draw, settle, then move the small contour gap using the measured opening
// reference. Inline marks stay in place; the opening's screen translation is omitted.
export function logoSample(progress: number) {
  const p = ((progress % 1) + 1) % 1;
  const frame =
    p < 0.22
      ? 229 + (p / 0.22) * 41
      : p < 0.45
        ? 270
        : 420 + Math.min(1, (p - 0.45) / 0.4) * 66;
  return { ...bootLogoTrack(frame), opacity: p > 0.88 ? (1 - p) / 0.12 : 1 };
}
export const loopingMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="rhine-logo" viewBox="0 0 310 145" role="img" aria-label="Rhine Lab"><path class="rhine-logo__wire" d="${bootMarkContour}" fill="none" stroke="currentColor" stroke-width="26"/><g class="rhine-logo__plus" fill="none" stroke="currentColor" stroke-width="15"><path d="M-25 0h50M0-25v50"/></g><path class="rhine-logo__minus" d="M-23 0h46" fill="none" stroke="currentColor" stroke-width="15"/></svg>`;

// Same approved mark, with the existing email and footprint for opening/loaders.
export const loopingLogoSvg = loopingMarkSvg
  .replace('viewBox="0 0 310 145"', 'viewBox="0 0 310 185"')
  .replace(
    "</svg>",
    '<text x="165" y="174" text-anchor="middle" font-family="MiSans,sans-serif" font-size="12" font-weight="600" letter-spacing="0.4">albert_z0413@hotmail.com</text></svg>',
  );

const policy = { low: false, reduced: false };
let hostSuspended = false;
const players = new Set<RhineLogoPlayer>();
/** Includes late-created project loaders, without observing the whole DOM. */
export function setRhineLogoPolicy(low: boolean, reduced: boolean) {
  const changed = low !== policy.low || reduced !== policy.reduced;
  policy.low = low;
  policy.reduced = reduced;
  for (const player of players) {
    player.setLow(low);
    player.setReduced(reduced);
  }
  if (changed)
    window.dispatchEvent(
      new CustomEvent("design-terminal:interface-policy", {
        detail: { ...policy },
      }),
    );
}
export const getRhineLogoPolicy = () => ({ ...policy });
export function setRhineLogoSuspended(suspended: boolean) {
  if (hostSuspended === suspended) return;
  hostSuspended = suspended;
  players.forEach((player) => player.setSuspended(suspended));
}

export class RhineLogoPlayer {
  private animations: Animation[] = [];
  private active = false;
  private low = policy.low;
  private reduced = policy.reduced;
  private inView = false;
  private suspended = hostSuspended;
  private intersection?: IntersectionObserver;
  private mode?: LogoMode;
  private requestedMode?: LogoMode;
  private media = matchMedia("(prefers-reduced-motion: reduce)");
  private observer: MutationObserver;
  private onVisibility = () => this.syncPlayback();
  private onMotion = () => this.refresh();
  constructor(
    private svg: SVGSVGElement,
    private qualityHost?: HTMLElement,
  ) {
    this.qualityHost ??=
      svg.ownerDocument.getElementById("three-scene") ?? undefined;
    this.observer = new MutationObserver(() => this.refresh());
    if (this.qualityHost)
      this.observer.observe(this.qualityHost, {
        attributes: true,
        attributeFilter: ["data-adaptive-tier"],
      });
    if (typeof IntersectionObserver === "function") {
      this.intersection = new IntersectionObserver((entries) => {
        this.inView = entries.some((entry) => entry.isIntersecting);
        // Hidden SVG geometry can have zero length in some engines. Retry once
        // when it becomes visible, without a polling loop.
        if (
          this.inView &&
          this.active &&
          !this.animations.length &&
          this.mode !== "still"
        )
          this.rebuild(this.mode!, true);
        this.syncPlayback();
      });
      this.intersection.observe(svg);
    }
    document.addEventListener("visibilitychange", this.onVisibility);
    this.media.addEventListener?.("change", this.onMotion);
    players.add(this);
    this.refresh();
  }
  setActive(active: boolean) {
    if (active !== this.active) {
      this.active = active;
      if (active) {
        if (this.inView && !this.animations.length && this.mode !== "still")
          this.rebuild(this.mode!, true);
        this.animations.forEach((a) => (a.currentTime = 0));
      }
      this.syncPlayback();
    }
  }
  setLow(low: boolean) {
    if (low !== this.low) {
      this.low = low;
      this.refresh();
    }
  }
  setReduced(reduced: boolean) {
    if (reduced !== this.reduced) {
      this.reduced = reduced;
      this.refresh();
    }
  }
  setSuspended(suspended: boolean) {
    if (suspended !== this.suspended) {
      this.suspended = suspended;
      this.syncPlayback();
    }
  }
  setMode(mode: LogoMode) {
    this.requestedMode = mode;
    this.refresh();
  }
  private refresh() {
    this.rebuild(
      this.media.matches || this.reduced
        ? "still"
        : (this.requestedMode ??
            (this.low || this.qualityHost?.dataset.adaptiveTier === "low"
              ? "light"
              : "full")),
    );
  }
  private rebuild(mode: LogoMode, retry = false) {
    if (mode === this.mode && !retry) return;
    this.animations.forEach((a) => a.cancel());
    this.animations = [];
    this.mode = mode;
    this.svg.dataset.logoMode = mode;
    if (mode === "still") return;
    if (!this.svg.animate || !this.intersection) {
      this.svg.dataset.logoMode = "still";
      return;
    }
    try {
      if (mode === "light")
        this.animations.push(
          this.svg.animate(
            [{ opacity: 1 }, { opacity: 0.78 }, { opacity: 1 }],
            {
              duration: LOGO_PERIOD_MS,
              iterations: Infinity,
              easing: "ease-in-out",
            },
          ),
        );
      else {
        const wire =
          this.svg.querySelector<SVGPathElement>(".rhine-logo__wire")!;
        const length = wire.getTotalLength();
        if (!Number.isFinite(length) || length <= 0) {
          this.svg.dataset.logoMode = "still";
          return;
        }
        const frames = Array.from({ length: 193 }, (_, i) => ({
          offset: i / 192,
          ...logoSample(i === 192 ? 0 : i / 192),
        }));
        const options: KeyframeAnimationOptions = {
          duration: LOGO_PERIOD_MS,
          iterations: Infinity,
        };
        this.animations.push(
          wire.animate(
            frames.map((f) => ({
              offset: f.offset,
              strokeDasharray: `${f.length * length} ${(1 - f.length) * length}`,
              strokeDashoffset: String(-f.start * length),
              strokeWidth: String(f.strokeWidth),
              opacity: f.opacity,
            })),
            options,
          ),
        );
        this.animations.push(
          this.svg.querySelector(".rhine-logo__plus")!.animate(
            frames.map((f) => ({
              offset: f.offset,
              transform: `translate(${f.plusX}px,70px) rotate(${f.plusAngle}deg) scale(${f.symbolScale})`,
              opacity: f.opacity,
            })),
            options,
          ),
        );
        this.animations.push(
          this.svg.querySelector(".rhine-logo__minus")!.animate(
            frames.map((f) => ({
              offset: f.offset,
              transform: `translate(${f.minusX}px,70px) scale(${f.minusWidth / 46},${f.symbolScale})`,
              opacity: f.opacity,
            })),
            options,
          ),
        );
      }
      this.syncPlayback();
    } catch {
      // A browser with incomplete SVG animation support keeps the static brand.
      this.animations.forEach((a) => a.cancel());
      this.animations = [];
      this.svg.dataset.logoMode = "still";
    }
  }
  private syncPlayback() {
    for (const a of this.animations) {
      if (this.active && this.inView && !this.suspended && !document.hidden)
        a.play();
      else a.pause();
    }
  }
  destroy() {
    players.delete(this);
    this.animations.forEach((a) => a.cancel());
    this.observer.disconnect();
    this.intersection?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.media.removeEventListener?.("change", this.onMotion);
  }
}
