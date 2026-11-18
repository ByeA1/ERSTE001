# 四档自动画质与档案封面更新 · 2026-11-14

> 最新决定：画质部分已由[启动前固定预设推荐规则](2026-11-14-fixed-quality-recommendation-and-tools.md)替代，不再动态调档。本文保留为历史记录，其余已完成改动仍保留。


本轮在 `D:\RhineTerminal` 的 `development/erste002-chapter-director` 工作树完成。没有改动 main 或部署。开始时已有大量未提交的性能、缓存、加载及 002 界面工作，本轮保留这些修改，没有把它们混合提交。

## 画质

入口：终端设置 → 渲染画质。四个档位为「流畅 / 均衡 / 清晰 / 完整」，第五项「自定义」保存用户参数。默认自动选择；卡片显示当前实际档位，也可点击固定一档，再用「自动选择」恢复。修改高级参数会进入自定义；固定档和自动档不会覆盖已保存的自定义参数。刷新后恢复选择及参数；旧手动配置迁入自定义。

| 档位 | 渲染比例 | DPR 上限 | 阴影 | AO / 分辨率 | 景深 | 透明材质分辨率 |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| 流畅 | 50% | 1× | 1024 | 关闭 | 0% | 25% |
| 均衡 | 85% | 1.5× | 1024 | 16 / 50% | 0% | 50% |
| 清晰 | 90% | 1.5× | 2048 | 16 / 75% | 100% | 75% |
| 完整 | 100% | 1.5× | 2048 | 32 / 100% | 100% | 100% |

完整档保留原始默认效果。自动调节沿用已有帧采样、预热、连续慢窗口、升降档冷却及空闲暂停逻辑，扩展为四档；不按设备名称猜测显卡性能。初始从完整档开始，只在持续实际绘制不足预算时逐级降低，有持续余量后逐级恢复。自定义可使用原有更高采样、SMAA 和渲染比例设置。超级性能模式仍是独立的临时覆盖项，界面保留覆盖说明。

002 使用同一个四档控制器，补充清晰档的像素预算，并正确继承固定档、自定义的手动锁定策略。单独打开 002 仍默认自动。没有改四章 11 镜、灯光、材质颜色或结构动画。

## 封面及拆解

001 / 002 共用同一版面：米白纸底、细线边框、四角标记、顶部项目集编号、底部项目标题及状态。主体以注册表 `coverFrame` 构图，完整保留两个产品轮廓和接触阴影；使用原渲染图，未改原素材。

图片区域从 1472×510 改为 1512×642，去掉原图片的大量空白边，产品线性尺寸约为原来的 **1.82 倍**，面积约 3.3 倍。底部信息收紧，标题不再挤占主图。

拆解查看器生成独立 WebGL 纹理副本，复制相同封面画布，随盖板组移动及复位；仍保留六组部件、原光学结构、清晰 / 磨砂、旋转和重组逻辑。关闭时释放新增纹理及几何体。两份原始 GLB 与 Git HEAD 的 SHA256 完全一致。

主要文件：`src/adaptive-quality.ts`、`public/cases/shared/adaptive-quality.js`、`src/main.ts`、`src/quality-settings.ts/.css`、`public/cases/erste002/story-app.js`；`content/projects.json`、`src/projects.ts`、`src/project-cover.ts`、`src/project-panel.ts`、`src/scene.ts`、`src/model-viewer.ts`、`src/terminal-ui-copy.ts`。

## 实际验证

- `npm run build` / TypeScript 通过。最终离线版本：`e2d3bdfb1ff3eb1e`。
- 44 项自动化测试通过：四档逐级升降与固定、自定义隔离、源图轮廓安全区、未来无裁切配置的项目、开场时间轴、目录、展示过渡、公共项目默认能力、封面开合。原有画质迁移、异常参数及 48 组设备尺寸限制检查通过。
- `check-quality-cover-runtime.mjs`：Edge 157.0.4341.46，1440×900 桌面、390×844 和 320×568 触控模拟全部通过。验证五个可见档位、实际缓冲尺寸、选择反馈、自定义刷新保存、自动恢复、中英文、卡片不溢出、两项目封面、拆解 / 重组精确复位、清晰 / 磨砂、002 手动档位继承及下一镜。无新增页面或控制台错误。
- `check-quality-scroll-runtime.mjs`：Edge 桌面与触控模拟通过；保留 001 首次滚动、章节跳转、重进阅读位置、双语和 002 固定低档继承。
- 002 单独打开时，实际运行控制器 mode 为 auto。
- `check-logo-usage.mjs` 通过。完整 `audit-logo-unification.mjs` 仍被本轮开始前已有的 cassette GLB 指纹不匹配阻断：旧审计预期 `dda42b9...`，当前与 HEAD 均为 `94fc471...`。没有修改模型或审计基线来绕过它。
- 手机为 Chromium 触控模拟，不代表已完成 iPhone Safari 实机验收；本轮没有做新的 FPS 性能基准，不将逻辑分级测试当成目标硬件性能承诺。

截图和原始结果在 `.audit/quality-cover-20261114/`。关键图：

- `before-detail.png` / `desktop-erste002-detail-stable.png`
- `before-exploded.png` / `desktop-erste002-exploded.png`
- `phone-erste002-detail-stable.png`
- `desktop-quality-zh.png` / `phone-quality-en.png`
- `runtime-results.json`

早期试跑时的 `*-failure.png` 保留用于追踪；以最终 `runtime-results.json` 的空 errors 及 stable 截图为准。部分初期非 stable 详情图拍到了设置面板退出的中间帧，不作为最终视觉图。

## 预览与回滚

当前开发预览：`http://127.0.0.1:5201/`。之后可在项目目录执行 `npm run dev -- --port 5201`。

本轮逐文件修改前后快照及哈希：`.audit/quality-cover-20261114/before/`、`after/`、`changes.json`。仅回滚本轮：

```
node .audit/quality-cover-20261114/rollback.mjs --check
node .audit/quality-cover-20261114/rollback.mjs --apply
```

回滚器先核对当前内容是否与本轮完成状态一致；检测到后续修改就停止。它恢复修改前快照，保留之前已经存在的未提交工作。不得用整库 restore 代替。
