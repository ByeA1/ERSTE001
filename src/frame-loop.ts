/** One cancellable RAF owner. start() is idempotent, including re-entry during a
 * callback; returning false sleeps until a real input/animation wakes the loop. */
export class FrameLoop {
  private id: number | undefined;
  private generation = 0;
  running = false;
  callbacks = 0;
  private draw: (ms: number) => void | boolean;
  private request: (cb: FrameRequestCallback) => number;
  private cancel: (id: number) => void;
  constructor(draw: (ms: number) => void | boolean,
    request: (cb: FrameRequestCallback) => number = cb => requestAnimationFrame(cb),
    cancel: (id: number) => void = id => cancelAnimationFrame(id)) {
    this.draw=draw;this.request=request;this.cancel=cancel;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.schedule(++this.generation);
  }
  stop() {
    this.running = false;this.generation++;
    if (this.id !== undefined) this.cancel(this.id);
    this.id = undefined;
  }
  private schedule(generation: number) {
    this.id = this.request(ms => {
      if (!this.running || generation !== this.generation) return;
      this.id = undefined;this.callbacks++;
      let keepGoing: void | boolean;
      try { keepGoing = this.draw(ms); }
      catch(error) { this.stop();throw error; }
      if (generation !== this.generation || !this.running) return;
      if (keepGoing === false) this.stop();
      else this.schedule(generation);
    });
  }
}
