// This module is reachable only in dev / model-review builds. No production URL
// override, decoder download, model replacement or Service Worker policy change.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { ArchiveScene } from './scene';
export const variants = ['original', 'draco-18', 'draco-16', 'meshopt-16', 'quantize-16'] as const;
type Variant = typeof variants[number];
const draco = new DRACOLoader().setDecoderPath('/cases/erste002/vendor/draco/').setWorkerLimit(2);
const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
type Metrics = Record<string, unknown>;
let source: ArrayBuffer;
let current: Variant;
const parse = (bytes: ArrayBuffer) => loader.parseAsync(bytes, '');
// ArchiveScene bakes world matrices into its geometry. Expand normalized integer
// attributes first, otherwise applyMatrix4 would clamp the dequantized positions.
function expand(gltf: GLTF) {
  gltf.scene.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const name of ['position', 'normal']) {
      const a = o.geometry.getAttribute(name);
      if (!a || (!a.normalized && a.array instanceof Float32Array)) continue;
      const values = new Float32Array(a.count * a.itemSize);
      for (let i = 0; i < a.count; i++) { values[i * a.itemSize] = a.getX(i); values[i * a.itemSize + 1] = a.getY(i); values[i * a.itemSize + 2] = a.getZ(i); }
      o.geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, a.itemSize));
    }
  });
}
function release(gltf: GLTF) {
  gltf.scene.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose(); } });
}
export async function loadReviewedCassette(scene: ArchiveScene, requested: string | null) {
  current = variants.includes(requested as Variant) ? requested as Variant : 'original';
  const start = performance.now();
  const metrics: Metrics = { variant: current, userAgent: navigator.userAgent, devicePixelRatio, viewport: [innerWidth, innerHeight] };
  const profile = new URLSearchParams(location.search).get('reviewNetwork') === 'office' ? '?profile=office' : '';
  const asset = `${import.meta.env.DEV ? '/.audit/model-logo/models' : '/review-assets/models'}/${current}.glb${profile}`;
  if (current.startsWith('draco')) draco.preload();
  const provider = { async loadAsync() {
    const response = await fetch(asset); if (!response.ok) throw Error(`GLB ${response.status}`);
    const headers = performance.now(); source = await response.arrayBuffer(); const body = performance.now();
    const gltf = await parse(source.slice(0)); const decoded = performance.now(); expand(gltf);
    Object.assign(metrics, { fileBytes: source.byteLength, fetchHeadersMs: headers - start, bodyReadMs: body - headers, fetchMs: body - start, parseDecodeMs: decoded - body, attributeExpansionMs: performance.now() - decoded });
    return gltf;
  } };
  await scene.load(asset, provider);
  metrics.loadAndInitializeMs = performance.now() - start;
  metrics.sceneInitializeMs = Number(metrics.loadAndInitializeMs) - Number(metrics.fetchMs) - Number(metrics.parseDecodeMs) - Number(metrics.attributeExpansionMs);
  const prepare = scene.prepareShaders.bind(scene);
  scene.prepareShaders = async () => {
    const t = performance.now(); await prepare(); metrics.shaderCompileMs = performance.now() - t;
    metrics.archiveReadyMs = performance.now() - start;
    metrics.resources = performance.getEntriesByType('resource').filter(e => /review-assets\/models|vendor\/draco|\.audit\/model-logo\/models/.test(e.name)).map(e => { const r = e as PerformanceResourceTiming; return { url: new URL(r.name).pathname, durationMs: r.duration, ttfbMs: r.responseStart - r.requestStart, downloadMs: r.responseEnd - r.responseStart, transferBytes: r.transferSize, encodedBytes: r.encodedBodySize, decodedBytes: r.decodedBodySize }; });
    window.parent.postMessage({ type: 'cassette-review-ready', metrics }, location.origin);
  };
  const warm = async (count = 5) => {
    const samples = [];
    for (let i = 0; i < count; i++) { const t = performance.now(); const gltf = await parse(source.slice(0)); const decoded = performance.now(); expand(gltf); samples.push({ parseDecodeMs: decoded - t, attributeExpansionMs: performance.now() - decoded }); release(gltf); }
    return samples;
  };
  const webgl = scene.renderer.getContext();
  const debug = webgl.getExtension('WEBGL_debug_renderer_info');
  metrics.renderer = debug ? webgl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : webgl.getParameter(webgl.RENDERER);
  const frameSample = (durationMs = 2000) => new Promise(resolve => {
    const samples: number[] = [], rafSamples: number[] = []; let start = 0, previous = 0, previousDraw = 0, lastFrame = scene.renderer.info.render.frame;
    const initialFrames = scene.getStats().renderedFrames;
    const tick = (now: number) => { if (!start) start = now; if (previous) rafSamples.push(now - previous); previous = now;
      const frame = scene.renderer.info.render.frame;
      if (frame !== lastFrame) { if (previousDraw) samples.push(now - previousDraw); previousDraw = now; lastFrame = frame; }
      if (now - start < durationMs) requestAnimationFrame(tick);
      else { const sorted = [...samples].sort((a,b) => a-b), stats = scene.getStats(); resolve({ phase: 'opening archive entry', source: 'Intervals between observed renderer frame advances; wall-clock cadence, not GPU timer', elapsedMs: now-start, renderedFrames: stats.renderedFrames-initialFrames, observedRafCallbacks: rafSamples.length, samples: samples.length, medianMs: sorted[Math.floor(sorted.length/2)], p95Ms: sorted[Math.floor(sorted.length*.95)], over33msPercent: samples.length ? samples.filter(x => x > 33.3).length / samples.length * 100 : null, documentVisible: !document.hidden, stats }); }
    }; requestAnimationFrame(tick);
  });
  (window as unknown as { __cassetteReview: unknown }).__cassetteReview = { metrics, warm, frameSample, scene, variant: current, async decoded() { const gltf = await parse(source.slice(0)); expand(gltf); return gltf; } };
}
