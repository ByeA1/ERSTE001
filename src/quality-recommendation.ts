import {adaptiveRenderQuality,type PerformanceMode,type PerformanceTier} from './adaptive-quality.ts';
import type {RenderQuality} from './render-quality';
export type StartupTierProbe = {
  frameMs:number[];cpuMs:number[];gpuMs:number[];method:string;drawCalls:number;triangles:number;
  width:number;height:number;
};
export type StartupQualityProbe = {
  frameMs: readonly number[]; source:string;drawCalls?:number;triangles?:number;
  tiers?:Partial<Record<PerformanceTier,StartupTierProbe>>;elapsedMs?:number;complete?:boolean;
};
const validSamples=(values:readonly number[])=>values.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
/** A real browse frame must leave room for input, text and browser composition.
 * Six samples per tier, evaluated once before opening, never while browsing. */
export function recommendPreset(probe:StartupQualityProbe):PerformanceTier {
  if(probe.tiers){
    for(const tier of ['high','standard','medium','low'] as const){
      const run=probe.tiers[tier],samples=validSamples(run?.frameMs??[]);
      if(!run||run.drawCalls<=0||run.triangles<=0||samples.length<6)continue;
      const median=samples[Math.floor(samples.length/2)];
      const p80=samples[Math.ceil(samples.length*.8)-1];
      if(median<=10&&p80<=12)return tier;
    }
    // If the bounded test cannot establish any passing tier, choose the light
    // preset rather than interpreting missing/slow frames as a fast full scene.
    return 'low';
  }
  // Unavailable/legacy probes cannot justify a full recommendation.
  return 'medium';
}
export class FixedQualitySelection {
  mode: PerformanceMode='recommended';
  tier: PerformanceTier='high';
  recommendedTier: PerformanceTier='high';
  completedAt:number|null=null;
  probe:StartupQualityProbe={frameMs:[],source:'unavailable; balanced fallback'};
  changes=0;
  private changed:()=>void;
  constructor(changed:()=>void=()=>{}){this.changed=changed;}
  complete(probe:StartupQualityProbe,now=performance.now()){
    if(this.completedAt!==null)return;
    this.probe=structuredClone({...probe,frameMs:[...probe.frameMs]});this.recommendedTier=recommendPreset(probe);this.completedAt=now;
    if(this.mode==='recommended')this.tier=this.recommendedTier;
    this.changed();
  }
  setMode(mode:PerformanceMode){
    const fixed=mode==='auto'||mode==='recommended'?this.recommendedTier:mode;
    if(this.mode===fixed)return;
    this.mode=fixed;this.tier=fixed==='custom'?'high':fixed;this.changes++;this.changed();
  }
  stats(){return {mode:this.mode,tier:this.tier,recommendedTier:this.recommendedTier,completedAt:this.completedAt,changes:this.changes,locked:true,source:this.probe.source,frameMs:this.probe.frameMs,drawCalls:this.probe.drawCalls,triangles:this.probe.triangles,tiers:this.probe.tiers,elapsedMs:this.probe.elapsedMs,complete:this.probe.complete};}
}

export function detailQuality(base:RenderQuality,tier:PerformanceTier,enabled:boolean):RenderQuality{
 if(!enabled)return base;
 const order:PerformanceTier[]=['low','medium','standard','high'];
 const next=order[Math.min(3,order.indexOf(tier)+1)];
 // Reuse full preset settings for the next level, with a legible printed cover.
 const full={...base,scale:100,pixelRatio:1.5,shadows:2048,aoSamples:32,aoResolution:1,depthOfField:100,transmission:1,anisotropy:16};
 return {...adaptiveRenderQuality(full,next),scale:100,pixelRatio:1.5,};
}
