import { currentLanguage } from './terminal-language';

// Explicit UI copy only. Never walk scene labels, rolling glyphs or project prose.
const pairs: readonly (readonly [string, string])[] = [
  ['终端偏好设置', 'Terminal preferences'],
  ['降低三维画质和渲染分辨率，保留完整动效；关闭后恢复原画质', 'Reduce 3D quality and resolution while retaining animations; turn off to restore your quality settings'],
  ['切列', 'Collections'], ['选档', 'Projects'], ['读取', 'Open'], ['检索', 'Search'], ['返回', 'Back'],
  ['ANALYSIS OS / 1.0 · 使用 MiSans 字体（小米）', 'ANALYSIS OS / 1.0 · MiSans by Xiaomi'],
  ['字体许可', 'Font licence'], ['界面基于', 'Interface based on'],
  ['启用完整动画并重播 ↻', 'Enable full animation and replay ↻'],
  ['动效设置', 'Animation settings'],
  ['完整、减少或按分项自定义；关闭后会立即收束当前动画（开场设置下次重播生效）', 'Use full, reduced or custom motion. Changes settle active animations immediately; opening changes apply on replay.'],
  ['完整', 'Full'], ['减少', 'Reduced'], ['自定义', 'Custom'],
  ['精细设置', 'Advanced settings'],
  ['开场 / 阵列 / 详情 / 界面 / 360° 查看器', 'Opening / Array / Details / Interface / 360° viewer'],
  ['开场', 'Opening'], ['档案阵列', 'Archive array'], ['档案详情', 'Archive details'], ['界面', 'Interface'], ['360° 查看器', '360° viewer'],
  ['开机标志、扫描与欢迎画面', 'Startup logo, scan and welcome screen'],
  ['选档时向阵列传播的波浪', 'Wave through the array when selecting a record'],
  ['停止操作后的阵列起伏', 'Array motion while idle'],
  ['镜头随指针的轻微偏移', 'Subtle camera offset following the pointer'],
  ['松手后按实际速度继续滑行', 'Continue gliding at the release velocity'],
  ['切列、切档时的轨道移动', 'Travel between collections and records'],
  ['抽取、转正、归位与详情镜头', 'Extract, face forward, return and frame the record'],
  ['模型解密线与磨砂揭示', 'Model decoding lines and frosted reveal'],
  ['正文的遮罩揭示', 'Masked reveal of document content'],
  ['标题、分类与权限标签滚动', 'Rolling titles, categories and access labels'],
  ['序号、列编号与档案编码滚动', 'Rolling indices, collection numbers and record codes'],
  ['详情、检索、收藏与设置窗口过渡', 'Transitions for details, search, saved records and settings'],
  ['360° 旋转、平移、缩放与复位阻尼', 'Damping for rotation, pan, zoom and reset'],
  ['拆解、重组与清晰度变化', 'Explode, reassemble and change clarity'],
  ['画质设置', 'Quality settings'], ['渲染画质', 'Rendering quality'], ['画质预设', 'Quality preset'],
  ['性能', 'Performance'], ['原始', 'Original'], ['高', 'High'], ['极高', 'Ultra'],
  ['清晰度 / 材质 / 阴影', 'Resolution / Materials / Shadows'],
  ['渲染比例', 'Render scale'], ['相对屏幕像素，受密度上限限制；高比例改善细线', 'Relative to screen pixels, capped by pixel ratio; higher scales sharpen fine lines'],
  ['像素密度上限', 'Pixel ratio limit'], ['控制高密度屏幕的原生像素倍率', 'Limit native pixel density on high-resolution screens'],
  ['抗锯齿', 'Antialiasing'], ['SMAA 平滑模型边缘与后处理结果', 'SMAA smooths model edges and the final image'],
  ['纹理过滤', 'Texture filtering'], ['改善倾斜视角下的标签细节', 'Improve label detail at oblique viewing angles'],
  ['透明材质分辨率', 'Transmission resolution'], ['控制盖板折射画面的清晰度', 'Control the clarity of refraction through the cover'],
  ['阴影分辨率 · 阵列', 'Shadow resolution · Array'], ['更高分辨率保留更细的投影边缘', 'Higher resolution preserves finer shadow edges'],
  ['关闭', 'Off'], ['环境遮蔽 · 阵列', 'Ambient occlusion · Array'], ['采样越多，接缝暗部越细腻', 'More samples refine shading in seams'],
  ['16 采样', '16 samples'], ['32 采样', '32 samples'], ['64 采样', '64 samples'],
  ['遮蔽分辨率 · 阵列', 'AO resolution · Array'], ['降低可减轻环境遮蔽的渲染负担', 'Lower resolution reduces the cost of ambient occlusion'],
  ['景深强度 · 阵列', 'Depth of field · Array'], ['0% 关闭；100% 保留原始镜头虚化', '0% disables blur; 100% retains the original depth of field'],
  ['即时生效并自动保存。清晰度与材质设置同步至 360° 查看器。高渲染比例更适合静态观察；缓冲上限为 829 万像素，硬件限制时自动收敛。', 'Changes apply immediately and are saved. Resolution and material settings also apply to the 360° viewer. Higher render scales suit still inspection; the buffer is capped at 8.29 million pixels and adapts to hardware limits.'],
  ['返回档案', 'Back to archive'], ['档案模型', 'Archive model'], ['玻璃模式', 'Glass finish'], ['清晰', 'Clear'], ['磨砂', 'Frosted'],
  ['模型装配结构', 'Model assembly'], ['ASSEMBLY / 装配结构', 'ASSEMBLY / COMPONENTS'],
  ['紧固件', 'Fasteners'], ['透明盖板', 'Optical cover'], ['折射环组', 'Refractive rings'], ['光学核心', 'Optical core'], ['信息基板', 'Substrate'], ['背板与框架', 'Carrier and frame'],
  ['正在载入模型…', 'Loading model…'], ['重新载入 ↗', 'Reload model ↗'],
  ['模型载入失败，请重试', 'Model failed to load. Please retry'],
  ['拆解档案', 'Explode assembly'], ['一键重组', 'Reassemble'], ['复位视角', 'Reset view'],
  ['已组装', 'Assembled'], ['已拆解', 'Exploded'], ['正在拆解', 'Exploding'], ['正在重组', 'Reassembling'],
  ['拖动旋转', 'Drag to rotate'], ['↑ ↓ ← → 平移', '↑ ↓ ← → Pan'], ['滚轮缩放', 'Scroll to zoom'],
  ['单指旋转', 'One finger to rotate'], ['双指缩放 / 平移', 'Two fingers to zoom / pan'],
  ['LS · DP 平移', 'LS · DP Pan'], ['Y 复位视角', 'Y Reset view'], ['LB · RB 选择操作 / A 确认 / B 返回', 'LB · RB Select / A Confirm / B Back'],
  ['档案三维模型：拖动旋转，方向键平移，滚轮或加减键缩放，Home 复位', '3D archive model: drag to rotate, arrow keys to pan, scroll or plus/minus to zoom, Home to reset'],
];
const translations = new Map<string, readonly [string, string]>();
for (const pair of pairs) { translations.set(pair[0], pair); translations.set(pair[1], pair); }

export function terminalCopy(value: string) {
  const pair = translations.get(value.trim());
  return pair ? value.replace(value.trim(), pair[currentLanguage() === 'zh' ? 0 : 1]) : value;
}

/** Localize a known UI fragment in place, retaining controls, focus and canvas identity. */
export function localizeTerminalCopy(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    node.nodeValue = terminalCopy(node.nodeValue ?? '');
  }
  root.querySelectorAll<HTMLElement>('[aria-label], [title], [placeholder]').forEach(element => {
    for (const key of ['aria-label', 'title', 'placeholder']) {
      const value = element.getAttribute(key);
      if (value) element.setAttribute(key, terminalCopy(value));
    }
  });
}

export function terminalMarkup(markup: string) {
  const template = document.createElement('template');
  template.innerHTML = markup;
  localizeTerminalCopy(template.content);
  return template.innerHTML;
}
