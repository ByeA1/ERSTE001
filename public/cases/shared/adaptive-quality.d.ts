import type { PerformanceTier, PerformanceMode } from '../../../src/adaptive-quality';
export const adaptivePolicy: {
  warmupMs: number; windowMs: number; minSamples: number;
  downgradeWindows: number; upgradeWindows: number;
  cooldownMs: number; upgradeCooldownMs: number;
  slowP75Ms: number; slowP90Ms: number; slowMeanMs: number;
  fastP90Ms: number; upgradeCpuP90Ms: number;
};
export class AdaptiveQuality {
  tier: PerformanceTier;
  mode: PerformanceMode;
  changes: number;
  constructor(onChange?: (tier: PerformanceTier) => void);
  resetTiming(now?: number): void;
  setMode(value: PerformanceMode, now?: number): void;
  observe(now: number, cpuMs: number, rendered: boolean, callbackIntervalMs?: number): void;
  stats(): {tier: PerformanceTier; mode: PerformanceMode; changes: number; p75Ms: number; p90Ms: number; meanDrawMs: number; cpuP90Ms: number; samples: number; source: string};
}
