import { terminalCopy, terminalMarkup } from "./terminal-ui-copy";
import {
  matchingPreset,
  presetLabels,
  type QualityPreset,
  type RenderQuality,
} from "./render-quality";
import { isWallpaper } from "./wallpaper";
import { escapeHtml } from "./html";
import {automaticTiers,tierNames,type PerformanceMode,type PerformanceTier} from './adaptive-quality';
import {t} from './terminal-language';

function choiceControl(attributes: string, label: string, value: string | number, choices: (readonly [string | number, string])[]) {
  if (isWallpaper) {
    const text = choices.find(([key]) => key === value)?.[1] ?? terminalCopy("自定义");
    return `<button type="button" ${attributes} class="quality-cycle" aria-label="${terminalCopy(label)}" title="点击切换${label}" value="${value}" data-quality-choices="${escapeHtml(JSON.stringify(choices))}"><span data-quality-label>${text}</span><span aria-hidden="true">↻</span></button>`;
  }
  return `<select ${attributes} aria-label="${terminalCopy(label)}">${choices.map(([key, text]) => `<option value="${key}" ${key === value ? "selected" : ""}>${text}</option>`).join("")}${value === "custom" ? '<option value="custom" disabled selected>自定义</option>' : ""}</select>`;
}

if (isWallpaper) document.addEventListener("click", event => {
  const button = (event.target as Element).closest<HTMLButtonElement>("[data-quality-choices]");
  if (!button || button.disabled) return;
  const choices = JSON.parse(button.dataset.qualityChoices!) as [string | number, string][];
  const index = choices.findIndex(([value]) => String(value) === button.value);
  const [value, label] = choices[(index + 1) % choices.length];
  button.value = String(value);
  button.querySelector("[data-quality-label]")!.textContent = label;
  button.dispatchEvent(new Event("change", { bubbles: true }));
});

function select(
  quality: RenderQuality,
  key: keyof RenderQuality,
  label: string,
  hint: string,
  choices: (readonly [string | number, string])[],
) {
  return `<label class="quality-control"><span>${label}<small>${hint}</small></span>${choiceControl(`data-quality="${key}"`, label, quality[key], choices)}</label>`;
}
function range(
  quality: RenderQuality,
  key: "scale" | "depthOfField",
  label: string,
  hint: string,
  min: number,
  max: number,
) {
  return `<label class="quality-control quality-range"><span>${label}<small>${hint}</small></span><div><input type="range" data-quality="${key}" aria-label="${terminalCopy(label)}" min="${min}" max="${max}" step="5" value="${quality[key]}"/><output data-quality-output="${key}">${quality[key]}%</output></div></label>`;
}
document.addEventListener('click',event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('[data-quality-mode]');
  const control=document.querySelector<HTMLInputElement>('#quality-mode');
  if(!button||!control)return;
  control.value=button.dataset.qualityMode!;
  control.dispatchEvent(new Event('change',{bubbles:true}));
  if(control.value==='custom')document.querySelector<HTMLDetailsElement>('.quality-advanced')!.open=true;
});
const pair=(words:readonly [string,string])=>t(words[0],words[1]);
function tierMarkup(){
  return `<div class="quality-tiers" role="group" aria-label="${t('四档画质与自定义','Four quality tiers and custom')}">${automaticTiers.map((tier,i)=>`<button type="button" data-quality-mode="${tier}"><span class="quality-tier-index">0${i+1}</span><strong>${pair(tierNames[tier])}</strong><small>${pair(({low:['轻量效果','Light effects'],medium:['精简后处理','Lean postprocessing'],standard:['细节与性能','Detail and performance'],high:['原始完整效果','Original full effects']} as const)[tier])}</small><em data-recommended-label></em></button>`).join('')}<button type="button" data-quality-mode="custom"><span class="quality-tier-index">C</span><strong>${t('自定义','Custom')}</strong><small>${t('保存个人参数','Saved personal settings')}</small></button></div>`;
}
export function qualityMarkup(quality: RenderQuality, performanceMode: PerformanceMode = 'recommended') {
  const preset = matchingPreset(quality);
  return terminalMarkup(`<section class="quality-settings" aria-label="画质设置">
    <div class="quality-heading"><h3>${t("渲染画质","RENDER QUALITY")}</h3>${isWallpaper?choiceControl('id="quality-preset"', "画质预设", preset, (Object.keys(presetLabels) as QualityPreset[]).map(key => [key, presetLabels[key]])):`<button type="button" class="quality-recommendation" data-quality-mode="recommended">${t('系统推荐','System recommendation')}</button>`}</div>
    ${!isWallpaper?`<input type="hidden" id="quality-mode" value="${performanceMode}">${tierMarkup()}<p class="quality-selection" id="quality-selection" aria-live="polite"></p>`:''}
    <p class="quality-summary" id="quality-summary" aria-live="polite"></p>
    <details class="quality-advanced"><summary>精细设置 <span>清晰度 / 材质 / 阴影</span></summary><div class="quality-grid">
    ${range(quality, "scale", "渲染比例", "相对屏幕像素，受密度上限限制；高比例改善细线", 50, 200)}
    ${select(
      quality,
      "pixelRatio",
      "像素密度上限",
      "控制高密度屏幕的原生像素倍率",
      [1, 1.5, 2, 3].map((v) => [v, `${v}×`]),
    )}
    ${select(quality, "antialias", "抗锯齿", "SMAA 平滑模型边缘与后处理结果", [
      ["off", "原始"],
      ["smaa", "SMAA"],
    ])}
    ${select(
      quality,
      "anisotropy",
      "纹理过滤",
      "改善倾斜视角下的标签细节",
      [1, 2, 4, 8, 16].map((v) => [v, `${v}×`]),
    )}
    ${select(
      quality,
      "transmission",
      "透明材质分辨率",
      "控制盖板折射画面的清晰度",
      [0.25, 0.5, 0.75, 1].map((v) => [v, `${v * 100}%`]),
    )}
    ${select(
      quality,
      "shadows",
      "阴影分辨率 · 阵列",
      "更高分辨率保留更细的投影边缘",
      [
        [0, "关闭"],
        [1024, "1024"],
        [2048, "2048"],
        [4096, "4096"],
      ],
    )}
    ${select(
      quality,
      "aoSamples",
      "环境遮蔽 · 阵列",
      "采样越多，接缝暗部越细腻",
      [
        [0, "关闭"],
        [16, "16 采样"],
        [32, "32 采样"],
        [64, "64 采样"],
      ],
    )}
    ${select(
      quality,
      "aoResolution",
      "遮蔽分辨率 · 阵列",
      "降低可减轻环境遮蔽的渲染负担",
      [0.5, 0.75, 1].map((v) => [v, `${v * 100}%`]),
    )}
    ${range(quality, "depthOfField", "景深强度 · 阵列", "0% 关闭；100% 保留原始镜头虚化", 0, 150)}
    </div></details><p class="quality-note">${isWallpaper ? "即时生效，仅限当前运行；长期设置请在 Wallpaper Engine 中调整。" : "即时生效并自动保存。"}清晰度与材质设置同步至 360° 查看器。高渲染比例更适合静态观察；缓冲上限为 829 万像素，硬件限制时自动收敛。</p>
  </section>`);
}

type QualityUIState = {tier:PerformanceTier;recommended:PerformanceTier;origin:'system'|'user';detail:boolean};
export function syncQualityUI(quality: RenderQuality, performanceMode: PerformanceMode = 'recommended', state?:QualityUIState) {
  const mode=document.querySelector<HTMLSelectElement>('#quality-mode');
  if(mode)mode.value=performanceMode;
  const tier=state?.tier??'high';
  const recommended=state?.recommended??tier;
  const system=state?.origin==='system';
  const selected=system?recommended:performanceMode==='auto'||performanceMode==='recommended'?tier:performanceMode;
  document.querySelectorAll<HTMLButtonElement>('[data-quality-mode]').forEach(button=>{
    if(button.dataset.qualityMode==='recommended'){
      button.textContent=system?t(`系统推荐 · ${pair(tierNames[recommended])}`,`System recommendation · ${pair(tierNames[recommended])}`):t(`使用系统推荐 · ${pair(tierNames[recommended])}`,`Use recommendation · ${pair(tierNames[recommended])}`);
      button.removeAttribute('aria-pressed');return;
    }
    button.setAttribute('aria-pressed',String(button.dataset.qualityMode===selected));
    button.dataset.recommended=String(system && button.dataset.qualityMode===selected);
    const badge=button.querySelector('[data-recommended-label]');
    if(badge)badge.textContent=button.dataset.qualityMode===selected?(system?t('推荐','Recommended'):t('已选择','Selected')):'';
  });
  const selection=document.getElementById('quality-selection');
  if(selection){
    const name=selected==='custom'?t('自定义','Custom'):pair(tierNames[selected]);
    const detail=state?.detail===true;
    const next=automaticTiers[Math.min(3,automaticTiers.indexOf(tier)+1)];
    selection.textContent=performanceMode==='custom'?t('自定义参数已保存并锁定，不会自动切换。','Custom settings are saved and locked. No automatic switching.'):
      !system?t(`手动选择：${name} · 已保存，系统不会替你切换。`,`Manual selection: ${name} · Saved; the system will not switch it.`):
      detail&&tier!=='high'?t(`系统预设：${name} · 详情临时使用${pair(tierNames[next])}，保持封面清晰；返回后恢复。`,`System preset: ${name} · Details temporarily use ${pair(tierNames[next])} with a clear cover; restored on return.`):
      t(`当前：${name} · 开场前完成系统推荐，选定后保持固定。`,`Current: ${name} · Recommended before opening; your selection stays fixed.`);
  }
  const preset = document.querySelector<HTMLSelectElement | HTMLButtonElement>("#quality-preset");

  const value = matchingPreset(quality);
  if (preset instanceof HTMLSelectElement) {
    let custom = preset.querySelector<HTMLOptionElement>('option[value="custom"]');
    if (value === "custom" && !custom) {
      custom = new Option(terminalCopy("自定义"), "custom");
      custom.disabled = true;
      preset.add(custom);
    } else if (value !== "custom") {
      custom?.remove();
    }
  }
  if(preset)preset.value = value;
  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("[data-quality]")
    .forEach((control) => {
      const key = control.dataset.quality as keyof RenderQuality;
      control.value = String(quality[key]);
      control.disabled = key === "aoResolution" && quality.aoSamples === 0;
    });
  document.querySelectorAll<HTMLButtonElement>("[data-quality-choices]").forEach(button => {
    const choices = JSON.parse(button.dataset.qualityChoices!) as [string | number, string][];
    button.querySelector("[data-quality-label]")!.textContent = choices.find(([value]) => String(value) === button.value)?.[1] ?? terminalCopy("自定义");
  });
  document
    .querySelectorAll<HTMLOutputElement>("[data-quality-output]")
    .forEach((output) => {
      output.value = `${quality[output.dataset.qualityOutput as keyof RenderQuality]}%`;
    });
}
