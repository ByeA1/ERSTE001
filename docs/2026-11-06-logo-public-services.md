# 全站 Logo 与新增项目公共能力统一

2026-11-06。源码只在 D:/RhineTerminal 修改；保留本轮开始时已有的未提交工作。本地开发、测试与构建完成，未部署、未推送。用户已确认上一轮 Logo 效果与 Radeon 780M 的 Draco18 方案，本轮继续使用它们。

## 已交付

全部适合动态展示的图形 UI 共用 rhine-logo.ts 的同一 SVG、logoSample 轨迹和 6.4 秒周期。没有重新设计 Logo。与本轮开始时的已确认版本相比，SVG 字面内容相同，运动相位/透明度在 8,193 个采样点上相同；boot-logo-tracks、boot-motion、opening-timeline 的 SHA 均未改变。

不仅是 Logo：新增项目的公共功能现在通过 project-viewer / ProjectLoading / ProjectInterface 默认装配。语言同步已移除 001/002 的项目 ID 分支，项目名单来自注册表；新项目没有手写档案概述时会从项目元数据生成默认概述和导出档案。已有手写概述、两项目内容和项目专属渲染代码保留。

## 所有 Logo 位置与状态

| 位置 / 来源 | 动态化状态 | 播放与例外 |
|---|---|---|
| 首页欢迎 .welcome-logo | 已统一 | 已确认的 SVG / 6.4s 轨迹，欢迎画面可见时播放 |
| 开场 .boot-logo | 已统一 | 同一带邮箱版本；保留外层位置与开场时序。网页开场原本隐藏这层；壁纸模式可见时播放 |
| 旧主加载层 .loading-mark | 已统一 | 同一带邮箱版本；网页现有开场隐藏旧层，不增加重复 Logo；壁纸等待期间播放 |
| 001 项目加载/确认/失败 UI | 已统一 | ProjectLoading，共用一套播放器，加载开始播放、退出/隐藏暂停 |
| 002 项目加载/确认/失败 UI | 已统一 | 同上；保留原有外围光学圆环与读取流程 |
| 所有后续注册项目的加载 UI | 默认继承 | 不需要逐项目补 Logo、进入/返回或加载脚本 |
| 新项目正文模板 [data-rhine-logo] | 默认继承 | 宿主自动挂载同一 SVG/播放器；动态新增/移除的容器也由共享层管理 |
| 001 / 002 当前项目正文 | 无额外图形 Logo | 正文与顶栏是项目名/文字标识；没有擅自加入新的视觉元素 |
| 本地对照页 full / light / still | 共用同一标准 | 保留三档预览，并加入离屏暂停 |
| 档案盒本体标签 | 保留静态实体印刷 | scene.ts / labelMarkSvg；不增加动态纹理 |
| 阵列实例、选中盒、返回中盒的标签 | 保留静态实体印刷 | 同一 Canvas 标签来源，按原有内容切换更新 |
| 360° 装配查看器的盒体标签 | 保留静态实体印刷 | createAssemblyModel 复制既有标签纹理，不另起动画或 WebGL pass |
| favicon.svg | 保留静态 | 浏览器标签图标不适合承担跨浏览器循环动画 |
| icons/app-icon.svg、apple-touch-icon.png、icon-192.png、icon-512.png、icon-maskable-512.png | 保留静态 | 操作系统/主屏幕图标，不是页面内播放位置 |
| 更新页、工作台、项目顶栏、页脚等 RHINE LAB / ANALYSIS OS 文字 | 保留文字 | 这些位置没有无限环图形，不把文字改造成新动画 |
| 产品照片/封面及实体几何上的标识 | 保留静态 | 内容/实物的一部分，不作为 UI 动画重绘 |

盘点覆盖 src 的 DOM 模板、BootSequence、Canvas 绘制、360° 模型标签，以及 public 的 HTML/JS/SVG 和图标。构建会执行 check-logo-usage，拒绝在项目页重新复制已知静态 UI 图形。静态品牌路径只供印刷标签/图标；原静态 UI logo 导出已移除。

## 新项目直接接入

1. 在 content/projects.json 登记项目自己的标题、编号、page、封面/摘要等内容，按现有方式提供项目资源。
2. 使用 cases/_template 的内容结构替换标题和正文。模板已经带公共 Logo 容器、语言控件、返回控件，不含项目初始化 JS。
3. 默认获得：目录/计数、档案概述、导出档案、统一加载/确认界面、进入返回、语言同步、图形 Logo、系统/站内减少动态效果、低性能状态、离屏/关闭暂停、重复进入复用。
4. 自定义模型/演出通过既定 pause/resume 与 case-policy 协议接收宿主状态；异步内容可声明 body[data-project-ready=loading] 并在完成/失败时设 ready/failed。内容资源和专属灯光/分镜仍由项目本身提供。

公共优化应改共享层，注册新项目不需要扩充项目 ID 白名单或补挂公共服务。模板中的 data-zh / data-en 是作者提供的双语内容，宿主负责切换，不猜写翻译。

自动化夹具在 Vite 测试进程内只向注册表增加 FUTURE099；没有写入真实注册表，没有添加档案记录、专属 JS 或宿主白名单。首页正常出现该项目，随后验证默认语言、Logo、降级、就绪、返回与重开。构建产物里不包含夹具项目。

## 暂停、降级与性能

- 所有图形 UI 都使用同一播放器。不可见位置由 IntersectionObserver 和所属流程共同暂停；页面隐藏、对话框关闭、加载淡出或壁纸宿主暂停时停止，恢复继续。重播按既有流程复位。
- full 沿用原 3 条原生动画；light 沿用透明度呼吸；系统或站内减少动态效果时 still。SVG 动画或可见性 API 不支持时保留静态。
- ProjectInterface 按文档复用，不反复装配。帧内字幕文字变化不触发扫描；只处理结构元素增删。关闭旧项目时显式暂停其原有循环，重开只恢复该项目。
- 修复了 dialog.close() 延迟事件在快速重开时取消下一次加载的问题。共享关闭清理先完成，再开始新加载，不给新项目打专属补丁。
- 无新增 Three/WebGL pass、模型或贴图动画。正式 JS 1,026,905 B，比上一轮约增加 5,830 B；共用现有资源，无新增 Logo 图片请求。SW 仍为 88 项，缓存策略与字体策略未改。

实体标签为 1024×440 Canvas，RGBA 单次约 1.80 MB；若按 60Hz 每帧上传，仅一张纹理就约 108 MB/s，尚未计算 mipmap、多个返回盒及 Canvas 绘制。该值是尺寸推算，不是实测带宽。保持静态既符合实体印刷，也避免明显 GPU/CPU 负担。

## 验证结果

- npm run build：通过，含 TypeScript 与公共使用检查；仍有原有大 bundle 提示。
- 原有 19 项：开场 11、项目目录 3、展示时序 5，全部通过。
- 新增默认概述/导出/冲突保护测试 3 项通过。
- Chrome / Edge 各桌面 1440×1000、手机尺寸 390×844/DPR2：共 4 场景通过。覆盖注册表单独新增项目、双向语言、统一轨迹/周期、真实滚动离屏暂停、低性能/减少动效、异步就绪、快速重开、返回及关闭 002 后 RAF 停止，无新增控制台错误。
- 原有首页拖动/旋转、002 自由查看/部件选择/展开/复位/滚动/重复进入与手机尺寸回归通过；Logo 三档、API 失败静态兜底、JSON 导出、触摸模拟及可见性事件测试通过。
- 壁纸模式已编译的开场/欢迎：Chrome / Edge 的相同 SVG、周期、宿主暂停恢复、低性能和减少动态效果验证通过。
- Git diff --check 通过。保护资源/时序 SHA 复核通过。

测试在本机 RTX 5070 Ti 与桌面浏览器进行，手机尺寸/触摸属于模拟；可见性事件中的后台测试有注入部分，滚动离屏与对话框关闭是真实 DOM 行为。Safari、Firefox、iPhone 与原生 Wallpaper Engine 本轮未实机测试，不把模拟当实机验收。

### 已知限制

额外运行 npm run build:wallpaper：Vite/TypeScript 编译成功，随后打包步骤因既有 docs/media/archive.jpg 缺失而失败。没有替换、伪造或重新渲染封面；这不影响通过的网站正式构建。壁纸运行测试使用已生成的编译内容，不声称打包已通过。

上一轮 Draco18 已由用户确认通过 Radeon 780M。本轮没有重压缩或更换其参数/解码入口；文件 529,428 B，SHA256：94fc471418156825cdbfa35d2202fad427c6b351f3aa6c0b99b4cbc5150820ee。原模型、其他模型和材质/灯光没有改。此轮没有重新进行 780M 硬件测试。

## 文件与证据

本轮修改/新增 24 个文件（之前已有的修改按本轮开始时快照保留）：

- AGENTS.md
- docs/2026-11-06-logo-public-services.md
- public/cases/_template/index.html
- scripts/audit-logo-unification.mjs
- scripts/audit-logo-wallpaper.mjs
- scripts/check-logo-usage.mjs
- scripts/check-project-catalogue.mjs
- scripts/check-project-defaults.mjs
- scripts/check-projects.mjs
- scripts/check-review-ui.mjs
- scripts/export-records.mjs
- scripts/rollback-logo-unification.mjs
- src/boot.ts
- src/brand.ts
- src/data.ts
- src/main.ts
- src/project-collections.ts
- src/project-interface.ts
- src/project-loading.css
- src/project-loading.ts
- src/project-records.d.mts
- src/project-records.mjs
- src/project-viewer.ts
- src/rhine-logo.ts

数据：.audit/logo-unification/browser.json、quick.json、wallpaper.json；旧回归输出在 .audit/model-logo/browser/interactions.json 与 review-ui.json。截图在 .audit/logo-unification/screenshots，包含桌面/手机项目加载器、新项目正文和壁纸开场/欢迎。

可复验命令：

~~~powershell
node scripts/check-logo-usage.mjs
node --test scripts/check-project-defaults.mjs
node --experimental-strip-types --test scripts/check-opening-timeline.mjs
node scripts/check-project-catalogue.mjs
node scripts/check-project-presentation.mjs
npm run build
node scripts/audit-logo-unification.mjs
~~~

浏览器夹具依赖本机 Chrome/Edge 和上一轮隔离工具目录的 Playwright；不需要给新项目安装运行时依赖。夹具无 .audit 前置快照时也可运行；存在本轮快照时会额外核对受保护资源。

## 本轮回滚

备份：.audit/logo-unification/before/。清单：.audit/logo-unification/rollback.json。

~~~powershell
node scripts/rollback-logo-unification.mjs
# 上一行只读校验，确认清单后：
node scripts/rollback-logo-unification.mjs --apply
npm run build
~~~

回滚仅撤销本轮，恢复到本轮开始时已有的未提交状态；不会退回上一轮之前，不改 Draco18。每个目标与备份均有 SHA 检查，检测到后续改动会在写入前拒绝。当前没有线上部署可回退。
