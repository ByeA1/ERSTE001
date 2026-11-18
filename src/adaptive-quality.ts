import type { RenderQuality } from './render-quality';

export type PerformanceTier = 'high' | 'standard' | 'medium' | 'low';
export type PerformanceMode = 'auto' | 'recommended' | 'custom' | PerformanceTier;
export const performanceLabels: Record<PerformanceMode, string> = {
  auto: '系统推荐', recommended: '系统推荐', custom: '自定义', high: '完整', standard: '清晰', medium: '均衡', low: '流畅',
};
export const normalizePerformanceMode = (value: unknown): PerformanceMode =>
  value === 'custom' || value === 'high' || value === 'standard' || value === 'medium' || value === 'low' ? value : 'recommended';

export function previewPixelRatio(tier: PerformanceTier, width: number, height: number, deviceRatio: number, textureLimit: number) {
  const ratio=tier==='high'?Math.min(deviceRatio,2):tier==='standard'?Math.min(deviceRatio,1.75):tier==='medium'?Math.min(deviceRatio,1.5)*.9:Math.min(deviceRatio,1)*.75;
  // High retains the preview's original DPR=2 ceiling, including 4K displays.
  // The existing home pipeline has its own unchanged 8.3-MP budget.
  return Math.min(ratio,tier==='high'?Infinity:Math.sqrt(8294400/Math.max(1,width*height)),textureLimit/Math.max(1,width,height));
}

/** Resolution and optional postprocessing only. Geometry, lighting, physical
 * materials, transmission and authored animation remain untouched. */
export function adaptiveRenderQuality(base: RenderQuality, tier: PerformanceTier): RenderQuality {
  if (tier === 'high') return { ...base };
  if(tier === 'standard')return {
    ...base,scale:Math.min(base.scale,90),pixelRatio:Math.min(base.pixelRatio,1.5),
    shadows:Math.min(base.shadows,2048),aoSamples:Math.min(base.aoSamples,16),
    aoResolution:Math.min(base.aoResolution,.75),transmission:Math.min(base.transmission,.75),
  };
  return {
    ...base,
    scale: Math.min(base.scale, tier === 'medium' ? 85 : 50),
    pixelRatio: Math.min(base.pixelRatio, tier === 'medium' ? 1.5 : 1),
    antialias: 'off',
    // Keep the shadow shader variant when stepping down again; disabling it
    // during a drag would recompile every lit surface on the main thread.
    shadows: Math.min(base.shadows, 1024),
    aoSamples: Math.min(base.aoSamples, tier === 'medium' ? 16 : 0),
    aoResolution: Math.min(base.aoResolution, .5),
    depthOfField: 0,
    // These are existing quality controls, not changes to authored materials.
    transmission: Math.min(base.transmission, tier === 'medium' ? .5 : .25),
    anisotropy: Math.min(base.anisotropy, tier === 'medium' ? 8 : 4),
  };
}

export { AdaptiveQuality, adaptivePolicy } from "../public/cases/shared/adaptive-quality.js";

/** Auto presets never overwrite the separately saved custom quality. */
export const automaticTiers: readonly PerformanceTier[] = ['low','medium','standard','high'];
export const tierNames = {
  low: ['流畅','Smooth'], medium: ['均衡','Balanced'],
  standard: ['清晰','Detailed'], high: ['完整','Full'],
} as const;
export function selectedQuality(base:RenderQuality,custom:RenderQuality,mode:PerformanceMode,tier:PerformanceTier){
  return mode==='custom'?{...custom}:adaptiveRenderQuality(base,mode==='auto'||mode==='recommended'?tier:mode);
}
