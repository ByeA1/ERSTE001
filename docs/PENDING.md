# 待办（法厄同大人口述）

> 规则：以下都是「先记着，不许动手」的项。法厄同大人明确说开工才做。

## 性能问题（2026-11-05 排查，未修改）

1. **Service Worker 预缓存了全部 753 个字体分片（23.3MB）**
   - 证据：线上 `sw.js` 的预缓存清单里 `fonts/*.woff2` 有 753 条；`dist/pwa-build.json` 同样 753 条。
   - 后果：新用户首访时后台下载二十几 MB，和首屏抢带宽，实测「下字体下了 5 秒以上」。
   - 方向：预缓存排除字体（或只留首屏 20 个分片），其余交给浏览器 HTTP 缓存。

2. **首屏档案盒 GLB 传输慢**
   - `archive-cassette.glb` 传输 1.2MB（gzip 后），冷启动耗时约 8.3 秒；GitHub Pages 国内无节点，单请求 TTFB 0.5–1.6 秒。
   - 方向：模型压缩（Draco/量化可到 400KB 级），或换托管。

3. **进 002 项目页重复下载三维引擎**
   - 案例页自带一套 three + Draco + 310KB 模型，冷启动 664KB、多个请求各 0.5–2 秒。
   - 方向：复用终端已下载的 three，或按需再加载。

4. **首页字体自身也有 20 个分片 / 450KB**
   - 方向：首屏文案子集化，或首页走系统字体兜底。

## 已知小问题

5. `_template` 目录 404：GitHub Pages 是 Jekyll 构建，下划线开头目录被忽略；`sw.js` 却把它列进预缓存 → `Cache.add` 失败、离线缓存整体装不上。
   - 修法：仓库根放空 `.nojekyll`；预缓存清单排除 `_template`。

6. three 弃用警告：`scene.ts` 用 `PCFSoftShadowMap`，新版自动降级为 `PCFShadowMap`（阴影略硬，功能正常）。

7. PWA 安装横幅被主动接管：`pwa.ts` 拦截 `beforeinstallprompt` 改由站内按钮触发，控制台那条提示属正常。

## 其他

- [ ] Blender 封面渲染：暂缓。规格见
      `C:\Users\Saki\Documents\Codex\2026-11-04\referenced-chatgpt-conversation-this-is-an\outputs\VVA-BLENDER-COVER-PROMPT.md`
      （统一 2000×1040 Hero、暖白底 #E8E4DA、左前上 3/4、透明版+阴影层，文件名 erste00X-hero-front-left-v01）
- [ ] 002 滚动讲解：模式已确认（滚动联携镜头/灯光/部件高亮/文字），分镜内容暂缓。
- [ ] 高亮规则：讲解用灯光打光；聚焦前允许用部件自发光闪两下作提示。
