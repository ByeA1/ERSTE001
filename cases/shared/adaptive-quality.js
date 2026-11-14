export const adaptivePolicy = {
    warmupMs: 1000, windowMs: 1200, minSamples: 24,
    downgradeWindows: 2, upgradeWindows: 6,
    cooldownMs: 3000, upgradeCooldownMs: 60000,
    slowP75Ms: 20, slowP90Ms: 28, slowMeanMs: 18.2,
    fastP90Ms: 17.5, upgradeCpuP90Ms: 5,
};
const tiers = ['high', 'medium', 'low'];
const percentile = (values, p) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
};
/** Samples only consecutive frames that actually drew the 3D scene.
 * CPU submission time is not a GPU timer. RAF cadence includes GPU backpressure,
 * layout, display cadence and other main-thread work; diagnostics say so. */
export class AdaptiveQuality {
    tier = 'high';
    mode = 'auto';
    last;
    windowStart;
    warmUntil;
    intervals = [];
    costs = [];
    drawIntervals = [];
    slow = 0;
    fast = 0;
    changedAt = -Infinity;
    summary = { p75Ms: 0, p90Ms: 0, meanDrawMs: 0, cpuP90Ms: 0, samples: 0 };
    changes = 0;
    onChange;
    constructor(onChange = () => { }) { this.onChange = onChange; }
    resetTiming(now) {
        this.last = undefined;
        this.windowStart = undefined;
        this.intervals = [];
        this.costs = [];
        this.drawIntervals = [];
        this.slow = this.fast = 0;
        this.warmUntil = now === undefined ? undefined : now + adaptivePolicy.warmupMs;
    }
    setMode(value, now = performance.now()) {
        if (this.mode === value)
            return;
        this.mode = value;
        this.tier = value === 'auto' ? 'high' : value;
        this.changedAt = now;
        this.resetTiming(now);
        this.onChange(this.tier);
    }
    observe(now, cpuMs, rendered, callbackIntervalMs) {
        if (this.mode !== 'auto')
            return;
        if (!rendered) {
            this.last = undefined;
            this.windowStart = undefined;
            this.intervals = [];
            this.costs = [];
            this.drawIntervals = [];
            this.slow = this.fast = 0;
            return;
        }
        const previous = this.last;
        this.last = now;
        this.warmUntil ??= now + adaptivePolicy.warmupMs;
        if (previous === undefined || now < this.warmUntil)
            return;
        // Use the browser's callback cadence when the renderer intentionally skips slots.
        const gap = now - previous;
        const interval = callbackIntervalMs ?? gap;
        if (gap > 1000 || !Number.isFinite(interval) || interval <= 0 || interval > 1000 || !Number.isFinite(cpuMs)) {
            this.resetTiming(now);
            return;
        }
        this.windowStart ??= previous;
        this.intervals.push(interval);
        this.drawIntervals.push(gap);
        this.costs.push(Math.max(0, cpuMs));
        if (now - this.windowStart < adaptivePolicy.windowMs || this.intervals.length < adaptivePolicy.minSamples)
            return;
        this.summary = { p75Ms: percentile(this.intervals, .75), p90Ms: percentile(this.intervals, .9),
            meanDrawMs: this.drawIntervals.reduce((sum,value)=>sum+value,0)/this.drawIntervals.length,
            cpuP90Ms: percentile(this.costs, .9), samples: this.intervals.length };
        // The actual drawn-frame mean detects missed 60-FPS slots even when
        // RAF itself is still fast. A 60-FPS cap on 144 Hz alternates gaps;
        // judge its mean rather than mistaking those intentional gaps for load.
        const bad = this.summary.meanDrawMs > adaptivePolicy.slowMeanMs ||
            this.summary.p75Ms > adaptivePolicy.slowP75Ms || this.summary.p90Ms > adaptivePolicy.slowP90Ms;
        const good = this.summary.meanDrawMs < 17.5 && this.summary.p90Ms < adaptivePolicy.fastP90Ms && this.summary.cpuP90Ms < adaptivePolicy.upgradeCpuP90Ms;
        this.slow = bad ? this.slow + 1 : 0;
        this.fast = good ? this.fast + 1 : 0;
        this.intervals = [];
        this.costs = [];
        this.drawIntervals = [];
        this.windowStart = undefined;
        const index = tiers.indexOf(this.tier), elapsed = now - this.changedAt;
        let next = this.tier;
        if (index < 2 && this.slow >= adaptivePolicy.downgradeWindows && elapsed >= adaptivePolicy.cooldownMs)
            next = tiers[index + 1];
        else if (index > 0 && this.fast >= adaptivePolicy.upgradeWindows && elapsed >= adaptivePolicy.upgradeCooldownMs)
            next = tiers[index - 1];
        if (next !== this.tier) {
            this.tier = next;
            this.changedAt = now;
            this.slow = this.fast = 0;
            this.changes++;
            this.onChange(next);
        }
    }
    stats() { return { tier: this.tier, mode: this.mode, changes: this.changes, ...this.summary, source: 'RAF cadence and CPU submission; not GPU timer' }; }
}
