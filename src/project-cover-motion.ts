/** The opening's 1.25-second cover wipe, reversible without replacing its image. */
export const PROJECT_COVER_DURATION = 1.25;
// Wait until the reference extraction has cleared neighboring cassettes.
export const PROJECT_COVER_OPENING_START = 29.1;
export class ProjectCoverMotion {
  activeId?: string;
  private requestedId?: string;
  private progress = 0;
  private target = 0;

  select(id?: string, show = true, animate = true) {
    this.requestedId = id;
    if (id && !show) {
      // Prime the opening before its existing reveal cue.
      this.activeId = id;
      this.progress = this.target = 0;
    } else if (id) {
      if (!this.activeId || this.progress === 0) this.activeId = id;
      this.target = this.activeId === id ? 1 : 0;
    } else this.target = 0;
    if (!animate) {
      this.activeId = id;
      this.progress = this.target = id && show ? 1 : 0;
    }
    this.settleClosed();
  }
  reveal(animate = true) {
    if (this.requestedId) this.select(this.requestedId, true, animate);
  }
  update(dt: number) {
    const before = this.progress, id = this.activeId;
    const distance = Math.max(0, dt) / PROJECT_COVER_DURATION;
    this.progress += Math.sign(this.target - this.progress) * Math.min(distance, Math.abs(this.target - this.progress));
    this.settleClosed();
    return before !== this.progress || id !== this.activeId;
  }
  private settleClosed() {
    if (this.progress !== 0 || this.target !== 0) return;
    if (!this.requestedId) this.activeId = undefined;
    else if (this.activeId !== this.requestedId) {
      this.activeId = this.requestedId;
      this.target = 1;
    }
  }
  get amount() { return this.progress * this.progress * (3 - 2 * this.progress); }
  get frame() {
    return { id: this.activeId, amount: this.amount,
      phase: !this.activeId ? 'closed' : this.target === 0
        ? this.progress > 0 ? 'closing' : 'primed'
        : this.progress === 1 ? 'open' : 'opening' };
  }
}
