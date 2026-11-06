# archive-cassette 与莱茵生命 Logo：本地审计交付

2026-11-06。唯一开发基线 D:/RhineTerminal，起始 HEAD 96fe9b953ee57c744c85f5cfa067aa25376f3481（现有 master 工作树）。未读取或合并旧 C: 站点工作树；未提交、推送或部署。本轮仅改首页 Logo 与隔离的 cassette 对照入口，不做架构、其他模型、002 分镜或灯光改造。

## 结论

优先推荐 Draco P18/N14/UV16：529,428 字节，达到 400–600 KB 目标；保留全部 17 个网格、17 个材质，材质原始 JSON 逐项一致，无纹理降采样或轮廓简化。本地视觉对照未见明显轮廓、透明、灯光变化。

当前只建议进入 Radeon 780M 验收，**尚不批准直接替换线上模型**。本机为 RTX 5070 Ti，已提供能导出实际设备结果的便携包。尚未收到 780M JSON，因此不能声称该设备体验已达标。压缩主要解决下载，几乎不减少运行时三角形或 GPU 渲染负担。

## 原文件结构与对照

原 GLB 3,565,116 B：JSON 18,252 B，17 meshes / 17 materials，95,865 个 POSITION 元素，86,154 个三角形，0 images / textures，含 transmission 与 IOR 材质扩展。几何主要占用 POSITION 1,150,380 B、NORMAL 1,150,380 B、TEXCOORD_0 729,152 B、indices 516,924 B。没有纹理可通过降清来压缩。

下表 kB 均为十进制 1,000 B。Chrome 156.0.8078.80 + ANGLE/D3D11 RTX 5070 Ti，无 CPU 降速，headless；每方案一个新 context/iframe 会话。冷解析包含所需解码工作线程初始化；热解析为同页 5 次重解码中位数。初始化为解析结束至 ArchiveScene.load 完成的剩余时间，包含材质、实例和项目封面准备；着色器另计。

| 方案 | GLB kB | gzip-9 模型 kB | 冷解析/解码 ms | 热解析中位 ms | 场景初始化 ms |
|---|---:|---:|---:|---:|---:|
| original | 3565.116 | 1355.025 | 4.9 | 1.7 | 31.1 |
| draco-16 | 440.148 | 366.413 | 29.5 | 10.2 | 28.7 |
| draco-18 | 529.428 | 438.639 | 26.8 | 12.3 | 29.1 |
| meshopt-16 | 1167.944 | 482.155 | 5.3 | 2.4 | 27.1 |
| quantize-16 | 2433.768 | 1111.397 | 4.0 | 1.3 | 27.9 |

Draco18 设置：edgebreaker，encodeSpeed=0，decodeSpeed=5，position18 / normal14 / UV16，mesh volume。Draco16 为 position16 / normal12 / UV14。Meshopt 为 medium、P16/N12/UV14；纯量化同精度，不使用专用解码器。

Draco 解码器复用既有 cases/erste002/vendor/draco：wrapper gzip 11,823 B + WASM gzip 88,507 B。Draco18 模型自身 gzip 比原版少约 67.6%；加上这两项首次冷解码资源为 538,969 B，比原模型 gzip 少约 60.2%。对照构建还含多编码器测试模块，不能把模型体积直接当作整个页面传输量。Meshopt 原始文件 1.168 MB，依赖 HTTP gzip 时模型传输约 482 KB，冷解码比 Draco 快，可作为 780M 上的备选；若宿主不压缩 GLB，Draco 的体积优势更稳定。

## 几何与观感

对所有 17 个子网格解码后做世界坐标双向最近点检查（不是只比包围盒），保留法线，逐项核对材质语义；另外确认四方案的原始 materials JSON 与原文件一致。

- draco-18：86,122 三角形；最大位置误差 0.000015895 个原模型单位；最大法线角误差 0.01466°。
- draco-16：86,122 三角形；最大位置误差 0.000063473 个原模型单位；最大法线角误差 0.05903°。
- meshopt-16：86,154 三角形；最大位置误差 0.000063285 个原模型单位；最大法线角误差 0.02362°。
- quantize-16：86,154 三角形；最大位置误差 0.000063285 个原模型单位；最大法线角误差 0.02362°。

Draco 的 32 个三角形差额全部来自原文件的零面积三角形；不是几何简化。模型对角线 6.239846 个源单位，不推断其物理单位。未删透明、边缘、标签或内部结构。Meshopt/纯量化的规范化整数属性在对照加载器中先展开成 Float32，再进入既有 applyMatrix4 流程，避免矩阵烘焙时坐标截断。生产默认加载路径不受此适配影响。

实际首页同镜头截图：

- [原版阵列](D:/RhineTerminal/.audit/model-logo/browser/Chrome-original-archive.png)、[Draco18 阵列](D:/RhineTerminal/.audit/model-logo/browser/Chrome-draco-18-archive.png)
- [原版近景](D:/RhineTerminal/.audit/model-logo/browser/Chrome-original-detail.png)、[Draco18 近景](D:/RhineTerminal/.audit/model-logo/browser/Chrome-draco-18-detail.png)
- [Logo 三档](D:/RhineTerminal/.audit/model-logo/browser/Chrome-logo-modes.png)、[移动尺寸 002](D:/RhineTerminal/.audit/model-logo/browser/Chrome-mobile-simulation-002.png)

## 网络与自然首显（模拟，不是公司网络实测）

用户提供原线上观察：7.01s = 1.02s waiting + 5.99s download，实际传输约 1,256 KB。这与 GLB 原始 3.565 MB 是不同计量。本地服务器 gzip-9 原模型为 1,355 KB，因此本轮受控模拟不会精确复现线上 7.01s。

模拟只给 cassette 请求配置 1.02s 首字节等待和 1,256,000/5.99 B/s 速率；解码器、字体、JS 等仍按本地速度。未模拟全部资源共享带宽或线上 CDN。以下为真实浏览器测出的受控模拟时间，不能标为 780M/公司网络结果：

| 浏览器 | 模型 | 获取模型 s（含等待） | 冷解析 ms | 初始化 ms | 着色器编译 ms |
|---|---|---:|---:|---:|---:|
| Chrome | original | 7.508 | 6.3 | 32.2 | 55.1 |
| Chrome | draco-18 | 3.140 | 28.5 | 32.6 | 45.1 |
| Edge | original | 7.507 | 5.6 | 31.7 | 58.3 |
| Edge | draco-18 | 3.126 | 28.2 | 32.3 | 46.2 |

Chrome 自然播放开场、不跳过时，从导航到 opening.phase=archive（开始三维阵列段）：原版 14.879s，Draco18 9.415s。这是开场进入三维段的观测点，并非完整项目页可交互时间。开场自身的时长、相位与文本未改。

着色器编译会受 GPU/驱动磁盘缓存影响；表中原版先运行，不应将首次编译较慢归因于模型压缩收益。不能从几十毫秒的本地高速下载推导真实 WAN 加速倍数。体积报告中的 predictedDownloadSeconds 只按用户 5.99s 和同一 gzip 体积比估算，不是实测。

## Logo 实现

src/rhine-logo.ts + CSS：SVG 连续轮廓，复用 brand.ts 的 Bezier 和 boot-logo-tracks.ts 的现有原版测量轨迹；轮廓绘入、极符号从中心展开/四分之一转、移动小缺口扫描、淡出循环。6.4s 一轮，是适配页面的还原式循环，不声称逐帧等同原片。节奏参数在 logoSample / LOGO_PERIOD_MS，可继续微调。

- full：3 条浏览器原生 Web Animations；不新增 JS 持续帧循环、纹理、WebGL pass、滤镜或资源请求。
- light：低性能或 SUPER PERFORMANCE 仅做整标透明度呼吸，保持完整轮廓。
- still：系统或站内减少动态效果时静止；SVG 动画 API 缺失或失败也保持静态 Logo。
- 仅欢迎画面激活；离开或 document.hidden 时暂停，恢复继续；重播欢迎时复位。质量变化复用已有 adaptive-tier，不新增设备型号判断。销毁时移除监听、观察器和动画。

印在 3D 盒上的 labelMarkSvg、原 BootSequence Logo、页面布局和中英文流程保留。正式 JS 原约 1,017,710 B，现 1,021,075 B，增加约 3.4 KB；新样式约 0.28 KB，均并入现有生产资源，不产生新网络请求。

## 测试与边界

- TypeScript 与 npm run build 通过；Vite 仍提示原有大 bundle 警告，不以消除警告代替验收。
- 必跑静态/时序校验：opening-timeline 11/11，project-catalogue 3/3，project-presentation 5/5，共 19/19。
- 浏览器：Chrome 156.0.8078.80、Edge 156.0.4314.58，均报告 NVIDIA RTX 5070 Ti ANGLE/D3D11。
- 14 次原版/候选加载 + 各 5 次热解析；无新 console error。
- 两浏览器桌面 1440×1000、390×844/DPR2 手机尺寸：欢迎 Logo、减少动态效果、实际拖动/旋转、语言、002 自由查看/部件选择/展开复位/滚动/进入返回/复用 iframe，横向布局无溢出。另以 CDP touchStart/Move/End 验证触摸拖动与旋转。这些是桌面浏览器模拟，**不是 iPhone 实机**。
- Logo full/light/still、低质量往返、API 不兼容注入降级、可见性事件注入暂停/恢复、对照页真实导出 JSON 均通过。隐藏事件为注入测试；没有将其宣称为真实 Safari 后台恢复验收。
- 正式生产构建隔离检查通过：没有 cassetteReview 开关、review-assets 模型路径、独立解码器 chunk。原模型 SHA 未变，其他模型/002 文件/Service Worker 源文件没有修改。
- 正式构建首次/缓存加载均验证：Chrome 原模型首轮 1,355,325 B，复访 0 B，response.fromServiceWorker=true；Edge 原模型首轮 1,355,325 B，复访 0 B，response.fromServiceWorker=true。预缓存仍为 88 项；此处测试的是既有策略继续工作，不是上线后的新模型缓存验收。
- 最终 ZIP 已实际解压，内置 Node v24.21.0 可运行；从独立目录启动服务器，Chrome 成功打开对照页、加载 Draco18/解码器、自然开场并导出计时数据；无控制台错误。
- 2s 帧探针只统计观察到 renderer frame 前进时的间隔，另记实际绘制数及 RAF 次数；为首显阶段诊断，不是 GPU timer 或长时间交互帧率证明。

**待验收**：Radeon 780M、Safari、Firefox、iPhone Safari、真实公司网络复测，以及最终线上 CDN 编码/缓存命中。GLB 压缩不会解决首页数百万实例三角形的全部 GPU 压力；若 780M 下载变快但仍卡顿，应在后续渲染任务中独立处理，不能用本次数据宣称已解决。

## 780M 操作

便携包：[ERSTE-780M-review.zip](D:/RhineTerminal/.audit/model-logo/ERSTE-780M-review.zip)，73.62 MB。

SHA256：793ac91917d22d19a4f85ce89253592f7e177c94e4a629c0b484b299900df8ab

完整解压 → 双击 Start.cmd → Chrome 打开 http://127.0.0.1:4178/reviews/model-logo/ → 填设备名称 → 前台运行全部方案 → 手动确认观感/交互 → 导出 JSON。可用 Edge 重复。先选本地网络测 CPU/GPU，再按需选公司网络模拟；后者不可当作真实网络数据。包内含中文说明和运行时，不需额外安装。Ctrl+C 停止服务器。

冷轮代表全新 iframe/解码工作线程和 no-store 资源；操作系统、驱动/着色器缓存可能仍热。对照构建不注册 SW，避免旧生产缓存串入，正式构建策略保持不变。

## 复现

隔离工具依赖安装在 .audit/model-logo/tools（不改站点 package.json / lockfile）：@gltf-transform/core、extensions、functions 4.5.1；draco3dgltf 1.5.9；meshoptimizer 1.0.1（与当前 Three 解码代际匹配）；playwright 1.65.0。干净机器先运行 npm ci，再安装这些隔离工具依赖。

~~~powershell
node scripts/audit-cassette.mjs
node scripts/check-cassette-quality.mjs
node scripts/build-cassette-review.mjs
node scripts/serve-cassette-review.mjs
# 另一个终端，预览服务器保持开启：
node scripts/test-cassette-browser.mjs
node scripts/test-model-logo-interactions.mjs
node scripts/test-cassette-browser.mjs --review-ui
node scripts/package-cassette-review.mjs
node scripts/test-cassette-browser.mjs --portable
# 正式构建缓存检查使用独立 4179 端口：
npm run build
node scripts/serve-cassette-review.mjs dist 4179 --production
node scripts/test-cassette-browser.mjs --production
~~~

原始数据：.audit/model-logo/model-sizes.json、geometry-quality.json、browser/results.json、interactions.json、review-ui.json、production-cache.json、portable.json。候选 GLB 在 .audit/model-logo/models；生产资源未替换。

## 修改文件（完整）

- .gitignore
- src/main.ts
- src/scene.ts
- src/rhine-logo.ts
- src/rhine-logo.css
- src/cassette-review.ts
- reviews/model-logo/index.html
- reviews/model-logo/review.ts
- scripts/audit-cassette.mjs
- scripts/build-cassette-review.mjs
- scripts/check-cassette-quality.mjs
- scripts/serve-cassette-review.mjs
- scripts/test-cassette-browser.mjs
- scripts/test-model-logo-interactions.mjs
- scripts/check-production-cache.mjs
- scripts/check-review-ui.mjs
- scripts/check-portable-review.mjs
- scripts/package-cassette-review.mjs
- scripts/rollback-model-logo.mjs
- docs/2026-11-06-cassette-logo-audit.md

其中产品代码只有 main.ts 的接入/测试构建守卫、scene.ts 的可选加载器参数、rhine-logo.ts/CSS。cassette-review.ts 仅 dev/model-review 可达；其余为对照、核验、文档工具。.audit/ 被忽略。

## 回滚

保留原文件于 .audit/model-logo/originals，回滚清单在 .audit/model-logo/rollback-manifest.json。先做只读校验：

~~~powershell
node scripts/rollback-model-logo.mjs
~~~

确认列出本轮文件后执行：

~~~powershell
node scripts/rollback-model-logo.mjs --apply
npm run build
~~~

回滚只恢复本轮 3 个原有文件并移除本轮新增文件；逐文件验证修改后 SHA 和原始备份 SHA，发现任何后来改动会在写入前拒绝，不使用 git reset。模型/002/缓存源代码本来就未改。当前没有生产部署可回退。
