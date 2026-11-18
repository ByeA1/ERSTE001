# ERSTE002 ENGINEERING 视觉重构交付

- [PC 访客预览](http://127.0.0.1:5210/cases/erste002/engineering.html)
- [握持对照](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=zh#eng-form-handling)
- [35 张逐图制作卡与摄影、NX 最简执行清单](ERSTE002-engineering-final-media-spec.md)
- [桌面版式、图号与访客文案复核](erste002-engineering-visual-evidence/final-media-layout-report.json)

工程页统一使用正式编排。版面上保留图号、图题和工程图注，细节图按工程主题折叠。35 个图位中，11 处使用临时档案照片或几何预览，24 处以图号保留对应画幅。正式版素材采用设计者提供的实拍、对应版本的 CAD 截图或经设计者确认的标注稿。制作要求集中在逐图规格文件。

清单中的每个 `IMG-*` 链接直达正式页面中的同编号图位，并展开对应专题。11 处临时素材均有逐图评估，35 处展示宽度按 1920 桌面版面更新。[底部折边剖面图位示例](http://127.0.0.1:5210/cases/erste002/engineering.html#IMG-S05)

握持段先呈现试握结论，再并排展示 `IMG-F03` 侧轮廓与 `IMG-F04` 握持。两图同为 16∶10，1920 × 1080 与 1440 × 900 下每张约 589 × 368 CSS px。图下各保留一行短图题，样件信息标在实物图上。改形前后的补充对照 `IMG-F05` 可独立展开。[1920 中文](erste002-engineering-visual-evidence/grip-1920-zh.jpg) · [1440 English](erste002-engineering-visual-evidence/grip-1440-en.jpg)

当前画面可查看[外形演进](erste002-engineering-visual-evidence/hierarchy-1440-en-form.jpg)、[迭代里程碑](erste002-engineering-visual-evidence/hierarchy-1440-en-evolution.jpg)、[结构专题](erste002-engineering-visual-evidence/hierarchy-1920-zh-case-stiffness.jpg)和[按键专题](erste002-engineering-visual-evidence/hierarchy-1440-en-case-button.jpg)。下表保留首轮视觉重构截图供对照。

## 页面结构

| 区段 | 主要视觉与阅读任务 | 截图 |
| --- | --- | --- |
| 00 Engineering Overview | 红滚轮实体首图、工程决策与当前设计入口、单行里程碑导航 | [1920 中文](erste002-engineering-visual-evidence/1920-zh-overview.jpg) · [1440 English](erste002-engineering-visual-evidence/1440-en-overview.jpg) |
| 01 Form Development | FDM 起点与三件实物并列，试握结论及两张等尺寸对照图，改形前后按需展开 | [1920 中文](erste002-engineering-visual-evidence/grip-1920-zh.jpg) · [1440 English](erste002-engineering-visual-evidence/grip-1440-en.jpg) |
| 02 Prototype Evolution | 五张里程碑卡默认展示关键发现，制作与后续按需展开 | [1920 中文](erste002-engineering-visual-evidence/1920-zh-evolution.jpg) · [1440 English](erste002-engineering-visual-evidence/1440-en-evolution.jpg) |
| 03 Engineering Decisions | 结构、按键、电池和遮光优先展示各自的设计结论及主图，实物观察和取舍按需展开 | [1920 中文](erste002-engineering-visual-evidence/1920-zh-decisions.jpg) · [1440 English](erste002-engineering-visual-evidence/1440-en-decisions.jpg) |
| 04 Current Design | 一张四行表并列 CAD 状态和实体验证边界 | [1920 中文](erste002-engineering-visual-evidence/1920-zh-current.jpg) · [1440 English](erste002-engineering-visual-evidence/1440-en-current.jpg) |

四张主图的正式画幅见[结构刚度](erste002-engineering-visual-evidence/final-media-stiffness.jpg)、[按键机构](erste002-engineering-visual-evidence/final-media-button.jpg)、[电池装配](erste002-engineering-visual-evidence/final-media-battery.jpg)与[缝隙遮光](erste002-engineering-visual-evidence/final-media-light.jpg)。

## 实际使用的临时图片

照片对应源文件在 `_archive/ERSTE002/ERSTE002_Engineering_Archive/00_原始附件/批次B_IMG4235-4244/`，网页使用 `public/cases/erste002/assets/engineering/` 中的 WebP 副本。照片同时提供 640 和 1536 宽度版本。下面的大文件名为图像放大用副本。

| 图号 | 网页文件 | 来源及所见 |
| --- | --- | --- |
| IMG-O01 | `p4238-1536.webp` | IMG_4238，红滚轮实体在前，另两件在后 |
| IMG-F01 | `p4241-1536.webp` | IMG_4241，未分件 FDM，改形前后尚未细分 |
| IMG-F02 | `p4237-1536.webp` | IMG_4237，由右上到左下为 FDM、第二版、红滚轮实体 |
| IMG-F03 | `p4242-1536.webp` | IMG_4242，FDM 侧轮廓 |
| IMG-P01 | `p4244-1536.webp` | IMG_4244，FDM 俯视 |
| IMG-P03 | `p4235-1536.webp` | IMG_4235，较晚裸壳，作为加杆阶段的结构参照 |
| IMG-P04 | `p4240-1536.webp` | IMG_4240，三件正面对照，红滚轮实体居中 |
| IMG-S01 | `p4236-1536.webp` | IMG_4236，裸壳内侧，标注可见内筋、杆件和安装柱 |
| IMG-S07 | `p01-inside.webp` | P01 / M001 历史 STL 内侧统一机位预览 |
| IMG-S08 | `p04-inside.webp` | P04 / M006、M007 历史 STL 内侧统一机位预览 |
| IMG-K02 | `m007-buttons.webp` | 裁切压缩自 `_archive/ERSTE002/_derived/previews/M007-buttons.png`。源 STL 为 `_archive/4.zip::新建文件夹/按键盖1.6.stl` |

IMG-K02 显示实际 M007 历史网格预览。四张主图按 IMG-S02 当前支撑总览、IMG-K01 按键纵剖前后对比、IMG-B01 电池三帧装入及 IMG-L01 遮光双状态横剖预留画幅。早期自绘草图可从历史提交和当时截图查阅。最终原图的版本、截面和标注规格见制作清单。

## 文字压缩

在浏览器的访客模式统计正文 `p` 节点，排除图表、折叠附录、制作卡和空白字符。中文长段定义为至少 75 字符，英文为至少 135 非空白字符。这里统计段落文字，状态表、标题、节点标签与图上标注另计。

| 语种 | 段落数 前 → 后 | 正文字数 前 → 后 | 正文压缩 | 长段数 前 → 后 |
| --- | ---: | ---: | ---: | ---: |
| 中文 | 81 → 23 | 3446 → 450 | 86.9% | 9 → 0 |
| English | 74 → 23 | 9777 → 952 | 90.3% | 35 → 0 |

同一口径结果见 [旧页面统计](erste002-engineering-visual-evidence/text-before.json) 和 [本轮复核](erste002-engineering-visual-evidence/final-media-layout-report.json)。

## 当前技术边界

- 当前 CAD 的完成状态来自设计者记录。最新 NX 文件或截图尚未提供，四项结构优化的真实前后位置、截面与尺寸仍需核对。整体刚度局限仍存在，整体抗扭和载荷—位移没有对应数据。
- 按键盖翘起是历史观察，片体刚度、连接削减与厚薄分配属于设计者归因。新版弯折位置、微动接触、限位、实际行程、寿命与耐久需复测。
- 电池三步图只表示向上装入、上盖内支撑与卡口定位紧固的关系。实际间距、桌面接触、卡口几何、保持力、振动和跌落尚未核实。
- 遮光的结构截面、实际漏光水平、按压前后剩余间隙与干涉状况尚未核实。
- 现有 FDM 样件不能分配到改形前或后，握持只提供设计反馈。历史 MJF 轮次、P01–P04 收件包、M007 按键盖与具体实体尚未逐一对应。首轮打印、干涉过程和历史按键运动的直接图像仍缺。

## 验收与版本

最终构建使用 Edge 检查 1920×1080 中文、1440×900 英文的五个区段与四个专题，另抽查 1024px 和 390px 的里程碑卡。实际解码 11 张图片，核对 35 个图号、直达链接及 1920px 版面宽度，同时检查细节展开、双语、图片键盘操作、浏览器历史与刷新恢复。确认独立页无 PRODUCT 运行时资源请求。原始照片与历史 CAD 包 14 件、现有 PRODUCT 与导航及参考文件 91 件对比原校验值一致。见 [完整性报告](erste002-engineering-visual-evidence/integrity.json)。

站点构建、开场、目录、项目展示、Logo 使用和公共能力检查通过。全站旧 Logo 审计的原始基线仍因历史档案盒模型哈希不一致退出，使用本轮前已有基线的 Chrome 桌面快速复查通过。

本轮在 `source` 本地提交。可用 `git log -1 -- public/cases/erste002/engineering.html` 查询重构记录。旧文案与第一阶段截图保留为历史证据。改素材配置后执行 `node scripts/build-002-engineering-archive.mjs` 重新生成页面与制作清单。重新预览使用 `npm run build`、`npm run preview -- --port 5210 --strictPort`。按需设置 `ERSTE_ORIGIN` 后运行 `node scripts/check-002-engineering-visual.mjs` 复查。
