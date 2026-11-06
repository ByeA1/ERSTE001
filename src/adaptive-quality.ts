import type { RenderQuality } from './render-quality';

export type PerformanceTier = 'high' | 'medium' | 'low';
export type PerformanceMode = 'auto' | PerformanceTier;
export const performanceLabels: Record<PerformanceMode, string> = {
  auto: '自动', high: '完整', medium: '均衡', low: '流畅',
};
export const normalizePerformanceMode = (value: unknown): PerformanceMode =>
  value === 'high' || value === 'medium' || value === 'low' ? value : 'auto';

export function previewPixelRatio(tier: PerformanceTier, width: number, height: number, deviceRatio: number, textureLimit: number) {
  const ratio=tier==='high'?Math.min(deviceRatio,2):tier==='medium'?Math.min(deviceRatio,1.5)*.9:Math.min(deviceRatio,1)*.75;
  // High retains the preview's original DPR=2 ceiling, including 4K displays.
  // The existing home pipeline has its own unchanged 8.3-MP budget.
  return Math.min(ratio,tier==='high'?Infinity:Math.sqrt(8294400/Math.max(1,width*height)),textureLimit/Math.max(1,width,height));
}

/** Resolution and optional postprocessing only. Geometry, lighting, physical
 * materials, transmission and authored animation remain untouched. */
export function adaptiveRenderQuality(base: RenderQuality, tier: PerformanceTier): RenderQuality {
  if (tier === 'high') return { ...base };
  return {
    ...base,
    scale: Math.min(base.scale, tier === 'medium' ? 90 : 75),
    pixelRatio: Math.min(base.pixelRatio, tier === 'medium' ? 1.5 : 1),
    shadows: Math.min(base.shadows, 1024),
    aoSamples: Math.min(base.aoSamples, 16),
    // Retain shared AO/DOF depth at medium. Lowering AO resolution while DOF
    // remains enabled would reintroduce a full geometry depth pass.
    depthOfField: tier === 'low' ? 0 : base.depthOfField,
  };
}

export const adaptivePolicy = {
  warmupMs: 2500, windowMs: 2500, minSamples: 45,
  downgradeWindows: 2, upgradeWindows: 6,
  cooldownMs: 15000, upgradeCooldownMs: 45000,
  slowP75Ms: 25, slowP90Ms: 40,
  fastP90Ms: 19, upgradeCpuP90Ms: 8,
} as const;
const tiers: PerformanceTier[] = ['high', 'medium', 'low'];
const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1, Math.floor(sorted.length*p))] ?? 0;
};

/** Samples only consecutive frames that actually drew the 3D scene.
 * CPU submission time is not a GPU timer. RAF cadence includes GPU backpressure,
 * layout, display cadence and other main-thread work; diagnostics say so. */
export class AdaptiveQuality {
  tier: PerformanceTier = 'high';
  mode: PerformanceMode = 'auto';
  private last?: number;
  private windowStart?: number;
  private warmUntil?: number;
  private intervals: number[] = [];
  private costs: number[] = [];
  private slow = 0;
  private fast = 0;
  private changedAt = -Infinity;
  private summary = { p75Ms: 0, p90Ms: 0, cpuP90Ms: 0, samples: 0 };
  changes = 0;
  private onChange: (tier: PerformanceTier) => void;
  constructor(onChange: (tier: PerformanceTier) => void = () => {}) { this.onChange=onChange; }
  resetTiming(now?: number) {
    this.last = undefined; this.windowStart = undefined;
    this.intervals = []; this.costs = []; this.slow = this.fast = 0;
    this.warmUntil = now === undefined ? undefined : now + adaptivePolicy.warmupMs;
  }
  setMode(value: PerformanceMode, now = performance.now()) {
    if (this.mode === value) return;
    this.mode = value;
    this.tier = value === 'auto' ? 'high' : value;
    this.changedAt = now;
    this.resetTiming(now);
    this.onChange(this.tier);
  }
  observe(now: number, cpuMs: number, rendered: boolean) {
    if (this.mode !== 'auto') return;
    if (!rendered) {
      this.last=undefined;this.windowStart=undefined;this.intervals=[];this.costs=[];this.slow=this.fast=0;
      return;
    }
    const previous = this.last; this.last = now;
    this.warmUntil ??= now + adaptivePolicy.warmupMs;
    if (previous === undefined || now < this.warmUntil) return;
    const interval = now - previous;
    if (!Number.isFinite(interval) || interval <= 0 || interval > 1000 || !Number.isFinite(cpuMs)) {
      this.resetTiming(now); return;
    }
    this.windowStart ??= previous;
    this.intervals.push(interval); this.costs.push(Math.max(0,cpuMs));
    if (now-this.windowStart < adaptivePolicy.windowMs || this.intervals.length < adaptivePolicy.minSamples) return;
    this.summary = {p75Ms:percentile(this.intervals,.75),p90Ms:percentile(this.intervals,.9),cpuP90Ms:percentile(this.costs,.9),samples:this.intervals.length};
    const bad = this.summary.p75Ms > adaptivePolicy.slowP75Ms || this.summary.p90Ms > adaptivePolicy.slowP90Ms;
    const good = this.summary.p90Ms < adaptivePolicy.fastP90Ms && this.summary.cpuP90Ms < adaptivePolicy.upgradeCpuP90Ms;
    this.slow = bad ? this.slow+1 : 0; this.fast = good ? this.fast+1 : 0;
    this.intervals=[];this.costs=[];this.windowStart=undefined;
    const index=tiers.indexOf(this.tier),elapsed=now-this.changedAt;
    let next=this.tier;
    if (index<2 && this.slow>=adaptivePolicy.downgradeWindows && elapsed>=adaptivePolicy.cooldownMs) next=tiers[index+1];
    else if (index>0 && this.fast>=adaptivePolicy.upgradeWindows && elapsed>=adaptivePolicy.upgradeCooldownMs) next=tiers[index-1];
    if(next!==this.tier){this.tier=next;this.changedAt=now;this.slow=this.fast=0;this.changes++;this.onChange(next);}
  }
  stats() { return { tier:this.tier,mode:this.mode,changes:this.changes,...this.summary,source:'RAF cadence and CPU submission; not GPU timer' }; }
}
