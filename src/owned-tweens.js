/** Scope existing GSAP recipes without changing their values/eases/timing. */
export function ownTweens(gsap, wake) {
  const owned = new Set(), paused = new Set();
  let suspended = false;
  function track(tween) {
    owned.add(tween);
    const done = () => { owned.delete(tween); paused.delete(tween); };
    tween.eventCallback('onComplete', done);
    tween.eventCallback('onInterrupt', done);
    if (suspended) { tween.pause(); paused.add(tween); }
    wake();return tween;
  }
  return {
    set: (...args) => gsap.set(...args),
    to: (...args) => track(gsap.to(...args)),
    fromTo: (...args) => track(gsap.fromTo(...args)),
    get size() { return owned.size; },
    suspend(value) {
      if (value === suspended) return;
      suspended=value;
      if (value) for(const tween of owned){if(!tween.paused()){tween.pause();paused.add(tween);}}
      else {for(const tween of paused)tween.resume();paused.clear();wake();}
    },
    dispose() { for(const tween of [...owned])tween.kill();owned.clear();paused.clear(); },
  };
}
