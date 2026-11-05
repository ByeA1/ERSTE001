export const OPENING_HANDOFF_DURATION = 1.1;
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return Math.max(0,Math.min(1,t * t * t * (t * (t * 6 - 15) + 10)));
};
/** Continue from the rendered film frame; reveal the document after settling. */
export function openingHandoffAt(elapsed: number) {
  return {
    motion: smooth(elapsed / OPENING_HANDOFF_DURATION),
    ui: smooth((elapsed - .16) / .8),
    complete: elapsed >= OPENING_HANDOFF_DURATION,
  };
}
