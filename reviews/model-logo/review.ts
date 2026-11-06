import { loopingMarkSvg, RhineLogoPlayer, type LogoMode } from '../../src/rhine-logo';
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
type Review = { metrics: Record<string, unknown>; warm(n: number): Promise<unknown>; frameSample(): Promise<unknown> };
const results: unknown[] = [];
const frame = $<HTMLIFrameElement>('#preview');
const status = $('#status');
let pending: ((value: Record<string, unknown>) => void) | undefined;
window.addEventListener('message', e => { if (e.origin === location.origin && e.source === frame.contentWindow && e.data?.type === 'cassette-review-ready') pending?.(e.data.metrics); });
function open(variant: string) {
  status.textContent = `正在加载 ${variant}…`;
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const timeout = setTimeout(() => { pending = undefined; reject(Error(`${variant}: 120s 内未就绪，请检查浏览器控制台`)); }, 120000);
    pending = metrics => { clearTimeout(timeout); pending = undefined; resolve(metrics); };
    frame.src = `/?cassetteReview=${encodeURIComponent(variant)}&reviewNetwork=${$<HTMLSelectElement>('#network').value}&trial=${Date.now()}`;
  });
}
async function run(variant: string) {
  const cold = await open(variant);
  const api = (frame.contentWindow as unknown as { __cassetteReview: Review }).__cassetteReview;
  const warm = await api.warm(5);
  status.textContent = `${variant} 资源已就绪，等待自然开场首次出现三维阵列…`;
  const child = frame.contentWindow as unknown as Window & { rhine: { stats(): { opening: { phase: string } } } };
  const deadline = performance.now() + 90000;
  while (child.rhine.stats().opening.phase !== 'archive') { if (performance.now() > deadline) throw Error('开场超时；保持测试页在前台后重试'); await new Promise(resolve => setTimeout(resolve, 50)); }
  cold.navigationToArrayPhaseMs = child.performance.now();
  const frameTimes = await api.frameSample();
  const resources = child.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const network = { transferredBytes: resources.reduce((n,r) => n+r.transferSize,0), encodedResourceBytes: resources.reduce((n,r) => n+r.encodedBodySize,0), zeroTransferEntries: resources.filter(r => r.transferSize===0 && r.decodedBodySize>0).length, note: '所有资源均由本地 no-store 服务器提供；0 传输项也可能是内联资源，不能单独判定缓存命中。' };
  const record = { date: new Date().toISOString(), deviceLabel: $<HTMLInputElement>('#device').value, networkMode: $<HTMLSelectElement>('#network').value, visualConfirmed: $<HTMLInputElement>('#visual').checked, cold, warm, frameTimes, network };
  results.push(record); $('#results').textContent = JSON.stringify(results, null, 2); status.textContent = `${variant} 已完成。可在下方首页继续交互检查。`;
  return record;
}
async function busy(action: () => Promise<unknown>) {
  const buttons = ['#load', '#suite'].map(s => $<HTMLButtonElement>(s)); buttons.forEach(b => b.disabled = true);
  try { await action(); } catch (e) { status.textContent = String(e); } finally { buttons.forEach(b => b.disabled = false); }
}
$('#load').onclick = () => void busy(() => run($<HTMLSelectElement>('#variant').value));
$('#suite').onclick = () => void busy(async () => { for (const variant of ['original', 'draco-18', 'draco-16', 'meshopt-16', 'quantize-16']) await run(variant); });
$('#export').onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ manualVisualConfirmedAtExport: $<HTMLInputElement>('#visual').checked, results }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `erste-cassette-${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
$('#copy').onclick = () => void navigator.clipboard?.writeText(JSON.stringify(results, null, 2)).catch(() => { status.textContent = '复制不可用，请导出 JSON'; });
for (const mode of ['full', 'light', 'still'] as LogoMode[]) { const figure = document.createElement('figure'); figure.innerHTML = `${loopingMarkSvg}<figcaption>${mode}</figcaption>`; $('#logos').append(figure); const player = new RhineLogoPlayer(figure.querySelector('svg')!); player.setMode(mode); player.setActive(true); }
