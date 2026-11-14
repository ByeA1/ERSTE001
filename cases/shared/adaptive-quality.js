export const adaptivePolicy = {
    warmupMs: 2500, windowMs: 2500, minSamples: 45,
    downgradeWindows: 2, upgradeWindows: 6,
    cooldownMs: 15000, upgradeCooldownMs: 45000,
    slowP75Ms: 20, slowP90Ms: 32,
    fastP90Ms: 19, upgradeCpuP90Ms: 8,
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
    slow = 0;
    fast = 0;
    changedAt = -Infinity;
    summary = { p75Ms: 0, p90Ms: 0, cpuP90Ms: 0, samples: 0 };
    changes = 0;
    onChange;
    constructor(onChange = () => { }) { this.onChange = onChange; }
    resetTiming(now) {
        this.last = undefined;
        this.windowStart = undefined;
        this.intervals = [];
        this.costs = [];
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
        this.costs.push(Math.max(0, cpuMs));
        if (now - this.windowStart < adaptivePolicy.windowMs || this.intervals.length < adaptivePolicy.minSamples)
            return;
        this.summary = { p75Ms: percentile(this.intervals, .75), p90Ms: percentile(this.intervals, .9), cpuP90Ms: percentile(this.costs, .9), samples: this.intervals.length };
        const bad = this.summary.p75Ms > adaptivePolicy.slowP75Ms || this.summary.p90Ms > adaptivePolicy.slowP90Ms;
        const good = this.summary.p90Ms < adaptivePolicy.fastP90Ms && this.summary.cpuP90Ms < adaptivePolicy.upgradeCpuP90Ms;
        this.slow = bad ? this.slow + 1 : 0;
        this.fast = good ? this.fast + 1 : 0;
        this.intervals = [];
        this.costs = [];
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
