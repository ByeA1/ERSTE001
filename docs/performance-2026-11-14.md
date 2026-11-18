# ERSTE 运行性能修复记录 · 2026-11-14

已在 `D:\RhineTerminal` 完成本地修改，未部署、未推送生产分支。开发起点为本轮开始时的工作树（HEAD `08dac92`，含此前未提交的 UI、PWA 修改），不是另一个旧源码目录。起点文件、指纹与工作树补丁保存在 `.audit/perf-20261114/`。

## 已确认的问题与修改

- **002 慢网被错误判为失败。** 原入口固定 25 秒截止，且等 iframe 的完整 `load`；模型预加载也会延后这个事件。改为 DOM 可用后接入宿主，按实际下载进度续期，保留 25 秒无进展与 120 秒总时限。8 秒后可返回，界面显示真实下载量及初始化状态。在演出真正展示时重新同步暂停/恢复，避免脚本较晚加载丢失首次恢复消息。
- **Service Worker 阻断模型流。** 原按需缓存路径 `await cache.put(response.clone())` 后才返回响应，缓存必须收完整个响应体，页面才能开始接收。现立即交付响应流，以 `event.waitUntil` 完成缓存写入；字体路径同样处理。安装失败仍删除整个未完成版本，更新仍须用户应用，保留原有版本隔离和导航重定向处理。
- **002 模型传输过大、脚本请求链较长。** 构建时用 Meshopt 压缩原始 buffer，禁用量化、删面、焊接和索引重排，再 gzip。源 GLB 不改；生产构建得到带内容哈希的压缩包。逐项验证全部顶点、颜色、索引、节点变换完全一致。002 模块合成一个运行文件，编辑源码仍保持现有模块和页面结构。
- **首页关键资源启动较晚。** HTML 直接预加载已通过 780M 验收的 Draco18 档案盒；解码器、模型和标签图片解码并行。慢封面不再阻挡模型就绪，图片到达后更新现有纹理，字体交换后重绘文字；取消旧的失效 GLB 封面回退及其额外 WebGL 上下文。开屏文字具备系统字体和既有 SVG 字样回退，字体不再无限阻塞开场。
- **首次绘制发生集中初始化。** 先应用已有画质/性能偏好，再预热实际使用的主画面、AO、景深和启用的抗锯齿变体，在不透明的 2D 开场后完成首次绘制初始化，再还原可见性、实例数量和剔除状态。性能模式不预热其关闭的后处理。高画质模型、材质和灯光参数保持原样；冷驱动仍需要初始化时间。
- **自动画质漏掉持续约 45 FPS。** 原阈值可容忍这一帧率而不降档。首页与 002 现在共用帧时间策略：2.5 秒预热/观察窗口、至少 45 个样本、两次慢窗口降一档、15 秒降档冷却；六次快窗口和 45 秒冷却才升档。P75 超过 20 ms 或 P90 超过 32 ms 视为慢窗口。002 在原高画质 145 万像素预算下加入中档 105 万、低档 75 万；不改几何、材质和灯光。保留 60/120 FPS 上限选择，高性能与高刷新率环境可到 120 FPS。
- **后台离线准备争用带宽。** 音频、字体来源文档和非首屏使用的作者/供应商模块改为按访问缓存。首页核心与 002 完整运行包仍按版本安装。音频需要在线使用一次后才可离线使用。

首页 `archive-cassette.glb` 仍为 **529,428 字节**，SHA-256 前缀 `94fc471418156825`。002 的原始 `shell-full.glb` 仍为 **7,107,132 字节**，SHA-256 前缀 `a7c8796cd5aec04d`。原有动态 Logo SVG、轨迹、节奏，开场时间轴，002 故事数据、灯光数据，以及本轮开始前的 HTML/CSS 修改均通过指纹对照确认未改。

## 可复核的对照

以下时间来自本机 Chrome 的**浏览器限速实验**，不是 4060、780M 或公司网络实测。条件：全新浏览器上下文，1536×864，Service Worker 关闭，延迟 180 ms，下载 150 KiB/s；测试服务器为 JS/CSS 等文本启用 gzip，GLB/WASM 按文件传输。两版使用同一设置，数据不代表生产 CDN 的精确传输行为。首页完整进入包含原有约 18 秒开场，不应把全部时间称为资源下载时间。

| 项目 | 本轮起点 | 修改后 |
| --- | ---: | ---: |
| 首页资源就绪（包含移到开场内的绘制初始化） | 14.44 s | 15.08 s |
| 首页首批 3D 帧被记录 | 21.13 s | 21.23 s |
| 首页完整进入详情 | 31.05 s | 30.05 s |
| 首页页面资源传输量 | 1.922 MB | 1.923 MB |
| 002 场景就绪 | 24.80 s | 17.33 s |
| 002 页面资源传输量 | 3.633 MB | 2.564 MB |
| 002 页面资源请求数 | 26 | 7 |
| 002 模型压缩包文件大小 | 3,342,750 B | 2,288,200 B |
| SW 初次预缓存文件数 | 78 | 46 |
| SW 初次预缓存文件体积（解压后的文件，不是网络流量） | 7,321,904 B | 4,288,823 B |

002 压缩包减少 **31.5%**，整个 002 页面在上述实验中的传输量减少约 **29.4%**。首页主要网络字节数基本未变，资源就绪和首批 3D 帧指标没有改善；其余改进集中在慢资源解耦、初始化时机和后台缓存争用。完整进入的约 1 秒差异不足以证明稳定收益，**不能宣称已解决用户报告的首页 40 秒实机问题**。这是最终构建的单次对照，不以中间构建较好的数字代替最终结果。

另以模型流约 60 KiB/s 的本地故障实验验证：旧入口在 **25.08 秒**中止并显示失败；修改后的入口持续接收进度，在约 **42.45 秒**正常打开，并确认实际开始绘制及演出推进。该实验用于证明慢网不再被固定截止时间误判，不是加载加速指标。数据：`.audit/perf-20261114/compare-slow-model-chrome.json`。

本机 GPU 为 **RTX 5070 Ti**。同一拖动/选择负载的 Chrome 首轮均值为 94.9 → 119.6 FPS；换成 Edge 并交换测量顺序，结果为 119.4 → 119.6 FPS。着色器缓存、初始化和测试顺序会影响首轮结果，因此**不将首轮差异当作稳定帧率提升承诺**。可确认完整画质仍可运行约 120 FPS。自动降档由持续帧时间触发，45 FPS 降档与正常 60 FPS 不误降已通过确定性测试。

## 测试与限制

- TypeScript 检查与 `npm run build` 通过。
- 82 项逻辑/资源测试通过：开场时间轴、交接、目录、未来项目默认服务、Logo 使用、拖动逻辑、画质与 60/120 限制、002 章节/灯光/真实剖切、无损模型逐项对照、错误压缩包/HTTP 错误/解压能力缺失/取消回退、SW 流式响应和导航缓存等。
- `scripts/check-loading-runtime.mjs`：Chrome、Edge 的桌面与 390×844 触控/高 DPR 模拟，通过首页完整开场、档案拖动、002 首帧与章节、自由旋转、部件提取/隔离/复位、高中低分辨率、中英文、减弱动效、全部后续镜头及剖切、返回开头、按需渲染、关闭释放、离线重进和首页缓存恢复。桌面两浏览器另验证成功更新、失败更新保留旧版和收藏保留。隐藏/恢复采用文档可见性事件模拟，不能等同于真实系统后台测试。
- 全站 Logo 审计通过 Chrome/Edge 桌面与移动模拟，包括仅注册的新项目默认服务；未改已确认的视觉标准。
- 字体与封面服务器不响应的故障实验中，真实 3D 开场仍正常进入，中文采用回退字体；没有等待网络恢复才能进入。默认画质与已保存的性能模式均验证。对应脚本 `scripts/check-opening-fallback.mjs`，性能模式可设置 `OPENING_PROFILE=super` 复测。
- 桌面/移动截图人工检查完成，没有横向溢出与新控制台错误。截图和 JSON 位于 `.audit/perf-20261114/`；Logo 审计位于 `.audit/logo-unification/`。
- **未验证真实 4060 笔记本及其无代理网络、780M、本轮 iPhone Safari、Firefox。** 本机没有对应硬件与已安装的 Firefox/WebKit 测试运行时。Chrome/Edge 的手机模拟不能替代 iPhone 验收。
- 首页首访仍需约 1.9 MB 的页面资源（在本实验的传输设置下），以及原有开场；没有更换托管或 CDN。实际公司网络路由、GPU 驱动、显示分辨率及供电状态仍需在目标笔记本复核。
- 构建仍提示主包较大；本轮没有以关闭警告作为验收，也未为了清除警告重构整个站点。

## 修改文件

运行/构建：`vite.config.ts`、`package.json`、`package-lock.json`、`src/main.ts`、`src/scene.ts`、`src/project-panel.ts`、`src/project-viewer.ts`、`src/project-loading.ts`、`src/opening-status.ts`、`src/adaptive-quality.ts`、`src/pwa.ts`、`public/cases/shared/adaptive-quality.js` 及其类型声明、`public/cases/erste002/model-load.js`、`public/cases/erste002/story-app.js`、新增的同版本 Meshopt 解码器、`scripts/build-case-runtime.mjs`、`scripts/pack-story-model.mjs`、`scripts/build-pwa.mjs`、`scripts/pwa-worker.js`。

验证：`scripts/check-model-loading.mjs`、`scripts/check-pwa-streaming.mjs`、`scripts/check-opening-fallback.mjs`、`scripts/check-loading-runtime.mjs`、`scripts/check-adaptive-runtime.mjs`、`scripts/check-production-cache.mjs`、`scripts/check-pwa-redirect.mjs`、`scripts/audit-logo-unification.mjs`。旧 Logo 审计更新为当前宿主导航、折叠工具栏和关闭释放行为，并可指定本轮起点；没有改变 Logo 图形或动画。

完整本轮文件清单及前后指纹：`.audit/perf-20261114/task-changes.json`。此前已有的 002 页面、目录及终端按钮 CSS 等未提交修改保留。

## 复测与回滚

构建预览：在 `D:\RhineTerminal` 执行 `npm run build`、`npm run preview`。不要用开发服务的多模块网络时序代替构建版本的加载验收。

本机现有测试工具路径可用于浏览器回归：

```powershell
$env:PLAYWRIGHT_MODULE='D:/RhineTerminal/.audit/model-logo/tools/node_modules/playwright'
node scripts/check-loading-runtime.mjs
node scripts/check-opening-fallback.mjs
$env:LOGO_AUDIT_BASELINE='.audit/perf-20261114'
node scripts/audit-logo-unification.mjs
```

本地对照实验脚本为 `.audit/perf-20261114/compare.mjs`（`network chrome`、`slow-model chrome`、`render chrome`）。原始数据保留在同目录。新测试需要先完成构建。

回滚必须回到本轮开始时的工作树，**不要用 `git restore` 丢弃其他未提交工作**：

```powershell
node .audit/perf-20261114/rollback.mjs --check
node .audit/perf-20261114/rollback.mjs --apply
npm run build
```

回滚器在任何写入前校验全部目标文件。若后续有人继续修改同一文件，它会停止，要求手工合并；不会覆盖后续修改。预检不写文件。本轮没有生产部署，因此无需回退线上发布。
