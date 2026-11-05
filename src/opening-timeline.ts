/** Resource waiting never seeks the opening clock. Times are seconds. */
// End the film shortly after the printed cover finishes, instead of parking
// the raised cassette in the distant shot until camera time 35.
const authorizationEnd = 4.8;
const entry = authorizationEnd + (21.9 - 17.76);
const archiveEnd = 31;
export const OPENING = { loadingEnd: 3, authorizationEnd, entry, archiveEnd, end: entry + (archiveEnd - 21.9) } as const;
export type OpeningPhase = 'loading' | 'authorization' | 'welcome' | 'archive';
export function openingAt(elapsed: number) {
  const time = Math.max(0, Math.min(OPENING.end, elapsed));
  const phase: OpeningPhase = time < OPENING.loadingEnd ? 'loading'
    : time < OPENING.authorizationEnd ? 'authorization'
    : time < OPENING.entry ? 'welcome' : 'archive';
  // Reuse the existing scan, welcome and archive camera, with continuous joins.
  const keys = [[0, 14.6], [OPENING.loadingEnd, 17.1],
    [OPENING.authorizationEnd, 17.76], [OPENING.entry, 21.9], [OPENING.end,archiveEnd]];
  const index = keys.findIndex((key, i) => i < keys.length - 1 && time <= keys[i + 1][0]);
  const [a, b] = index < 0 ? keys.slice(-2) : keys.slice(index, index + 2);
  const referenceTime = a[1] + (b[1] - a[1]) * (time - a[0]) / (b[0] - a[0]);
  return { time, phase, referenceTime, complete: time >= OPENING.end };
}
export class OpeningTimeline {
  private elapsed = 0;
  private previous = 0;
  private held = false;
  restart(now: number) { this.elapsed = 0; this.previous = now; this.held = false; }
  sync(now: number) { this.previous = now; }
  advance(now: number, ready: boolean) {
    // GPU/font parsing can block the main thread. Never catch up by skipping
    // an entire authorization or welcome beat in the first frame afterwards.
    const delta = Math.min(.1, Math.max(0, now - this.previous));
    this.previous = now;
    if (this.held) {
      this.held = !ready;
      return this.state;
    }
    const next = this.elapsed + delta;
    if (!ready && this.elapsed <= OPENING.loadingEnd && next >= OPENING.loadingEnd) {
      this.elapsed = OPENING.loadingEnd; this.held = true;
    } else this.elapsed = next >= OPENING.end - 1e-9 ? OPENING.end : next;
    return this.state;
  }
  get state() {
    const state = openingAt(this.elapsed);
    return { ...state, phase: this.held ? 'loading' as const : state.phase, held: this.held };
  }
}
