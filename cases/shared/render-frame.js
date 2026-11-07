export const WEB_RENDER_FPS = 60;
const HIGH_REFRESH_FPS = 120;

const tolerance = 0.5;
const boostWindowMs = 2000;
const fallbackWindowMs = 750;
const retryDelayMs = 8000;

/** Rate budget shared by the terminal and project-owned WebGL loops. */
export class RenderFrameLimiter {
  #nextFrame;
  #lastCallback;
  #sample;
  #retryAt = 0;
  #fpsLimit = WEB_RENDER_FPS;

  get fpsLimit() {
    return this.#fpsLimit;
  }

  admit(now, allowHighRefresh = true) {
    this.#observeCadence(now, allowHighRefresh);
    const interval = 1000 / this.#fpsLimit;
    this.#nextFrame ??= now;
    const elapsed = now + tolerance - this.#nextFrame;
    if (elapsed < 0) return false;
    // Skip expired slots after a stall. A callback never draws catch-up frames.
    this.#nextFrame += (Math.floor(elapsed / interval) + 1) * interval;
    return true;
  }

  recordFrame(cpuMs) {
    if (!this.#sample) return;
    this.#sample.draws++;
    if (cpuMs > (this.#fpsLimit === WEB_RENDER_FPS ? 5 : 8)) {
      this.#sample.expensive++;
    }
  }

  #observeCadence(now, allowHighRefresh) {
    const gap = this.#lastCallback === undefined ? 0 : now - this.#lastCallback;
    this.#lastCallback = now;
    if (!allowHighRefresh || gap > 250 || gap < 0) {
      if (this.#fpsLimit === HIGH_REFRESH_FPS) this.#retryAt = now + retryDelayMs;
      this.#fpsLimit = WEB_RENDER_FPS;
      this.#sample = undefined;
      return;
    }

    const sample = this.#sample ??= { start: now, callbacks: 0, late: 0, draws: 0, expensive: 0 };
    if (gap > 0) {
      sample.callbacks++;
      if (gap > 9.5) sample.late++;
    }
    const boosted = this.#fpsLimit === HIGH_REFRESH_FPS;
    if (now - sample.start < (boosted ? fallbackWindowMs : boostWindowMs)) return;

    const overloaded = sample.late > sample.callbacks * 0.1 || sample.expensive > sample.draws * 0.1;
    if (boosted && overloaded) {
      this.#fpsLimit = WEB_RENDER_FPS;
      this.#retryAt = now + retryDelayMs;
    } else if (!boosted && !overloaded && sample.draws >= 60 && now >= this.#retryAt) {
      this.#fpsLimit = HIGH_REFRESH_FPS;
    }
    this.#sample = undefined;
  }

  reset() {
    this.#nextFrame = undefined;
    this.#lastCallback = undefined;
    this.#sample = undefined;
    this.#retryAt = 0;
    this.#fpsLimit = WEB_RENDER_FPS;
  }
}
