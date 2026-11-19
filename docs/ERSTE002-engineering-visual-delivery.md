# ERSTE002 ENGINEERING｜五版结构对比

[五版对比中文版](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=zh&view=versions#eng-comparison) · [English comparison](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=en&view=versions#eng-comparison)

2026 年 11 月 19 日，设计者确认 1–5 号 ZIP 对应 V1–V5。网页从首屏进入五列的结构对比，每列用整体斜俯和底部内视对应一个版本，可放大图片或进入该版记录。每一类比较采用固定正交机位、尺度和裁切。

| 正式版本 | 原始文件 | 可见几何变化 | 现有实物依据 |
| --- | --- | --- | --- |
| V1 | `1.zip`。上盖 1.3 试打印 | 单件上盖，前部开口外露。弧筋沿壳分布，可看到前部安装区与后段筋板之间的开口。 | 早期 FDM 试握记录与照片单独说明外形探索。 |
| V2 | `2.zip`。上盖与按键盖 1.4 | 上盖与按键盖分件，独立盖片带双安装舌。壳体保留后部弧筋，移动部分安装柱与相邻筋位。 | 首轮 MJF 有整机偏软、孔位偏差的定性记录。 |
| V3 | `3.zip`。上盖与按键盖 1.5 | 前部开口新增长跨杆，后部出现额外跨接件。按键盖内侧加入交叉筋和凸台，后部连接改为短片与圆形座。 | 后续装配记录有 PCB 干涉、拆杆后可装配及刚度不足。 |
| V4 | `4.zip`。上盖与按键盖 1.6 | V3 的一根前部长杆在 V4 网格中消失，后段仍保留跨接件。按键盖延续短连接片。 | 红滚轮样机完成整机装配。裸壳有实拍，支撑偏弱、按键翘起、电池难装有定性记录。 |
| V5 | `5.zip`。上盖 1.7.1 与按键盖 1.7.2 | 前部出现转折跨杆，后段形成网格状加强布局，底缘有折边。按键盖后部安装片延伸并保留镂空，盖片边缘有折边。 | 有设计修改记录。档案无同版实物或性能验证记录。 |

V4 网格与 V3 的差异用于阅读结构。某次拆杆重装由装配记录支持。V5 电池从底部向上装入来自设计记录，STL 仅包含壳件。最终方案未新增电池卡扣，未实施缝隙遮光。

路线结论延续设计者的定性复盘。后部筋板相对有效，前部开口与安装位中断传力，跨接构件同时占用装配空间。针对 ERSTE002 的约束，设计者偏向传统上下壳。两种结构尚无同一工况的重量或刚度对照。

## 页面截图

- [五版同机位对比 · 中文 1920×1080](erste002-engineering-visual-evidence/versions-1920-zh-comparison.jpg) · [English 1440×900](erste002-engineering-visual-evidence/versions-1440-en-comparison.jpg)
- [V2 前部开口、安装柱和后部筋板](erste002-engineering-visual-evidence/versions-1920-zh-evolution.jpg) · [V4 总装与裸壳](erste002-engineering-visual-evidence/versions-1920-zh-built.jpg)
- [V4 → V5 前部局部](erste002-engineering-visual-evidence/versions-1920-zh-case-stiffness.jpg) · [V2 → V5 按键盖](erste002-engineering-visual-evidence/versions-1440-en-case-button.jpg) · [路线复盘](erste002-engineering-visual-evidence/versions-1920-zh-current.jpg)
- [手机端对比 · 390px](erste002-engineering-visual-evidence/versions-390-zh-comparison.jpg)

## 素材与验收

- 当前页面有 18 张正式 STL 工程渲染和 7 张实物照片。原始视图分别为 5 张整体、5 张内侧、4 张按键盖和 4 张前后壳局部。18 张 WebP 合计约 291 KiB。详细列出图号、来源、展示用途和七组可补充的实物或剖切证据。 [最终图片与补充证据](ERSTE002-engineering-final-media-spec.md)
- 五个源 ZIP 与九个 STL 成员按 SHA-256 核对。原网格未作变形、零件增补或单独缩放。文件单位无声明。正式版次映射、原件哈希、取景和图号分别可追溯。 [STL 核验记录](erste002-engineering-visual-evidence/route-stl-audit.json) · [内部工程事件表](ERSTE002-engineering-traceability.md)
- Edge 检查 1920×1080 中文和 1440×900 英文。25 张图加载，版本列与比较行对齐。通过 25 个图号、12 个跨版本链接、放大、键盘、浏览器前进后退和语言切换。390px 完成对比区基础检查。 [浏览器报告](erste002-engineering-visual-evidence/versions-browser-report.json)
- 构建、开场时间线、项目目录与展示、默认公共能力检查通过。独立全站 Logo 审计仍报告既有卡带模型与旧基线的哈希差异。验收范围为 ENGINEERING 页面。

网页和素材清单由 `node scripts/build-002-engineering-archive.mjs` 生成。按已核验的渲染清单更新图片可运行 `python -X utf8 scripts/prepare-002-route-previews.py .audit/erste002-route-review`。本地预览使用 `npm run build`，然后运行 `npm run preview -- --port 5210 --strictPort`。可运行 `node scripts/check-002-engineering-visual.mjs` 复测。
