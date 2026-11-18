# ERSTE002 ENGINEERING 视觉重构交付

[本地工程档案](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=zh&view=history#eng-overview) · [内部追溯表](ERSTE002-engineering-traceability.md) · [最终素材规格](ERSTE002-engineering-final-media-spec.md) · [浏览器验收](erste002-engineering-visual-evidence/history-report.json)

项目共五版。网页按 A–E 的已记录工程事件展开。相片身份、个别机械构型与具体打印批次的对应关系依原始来源分别核对。

## 页面结构

| 区段 | 主要内容与布局 | 浏览器实图 |
| --- | --- | --- |
| 00 概览 | 红滚轮实体首图、A–E 快速导航、刚度/按键/装配追溯入口 | [概览](erste002-engineering-visual-evidence/history-overview.jpg) |
| A 外形探索 | 未分件 FDM、握持对照、一次改形与右手外形。说明何时转入活动件和内部安装开发 | [握持](erste002-engineering-visual-evidence/history-form.jpg) |
| B 首轮机械结构 | 两组主图对读分件与首次 MJF，再放大初始筋板及孔位。说明截面抗弯、配合基准和首次装配反馈 | [筋板与孔位](erste002-engineering-visual-evidence/history-first-fit.jpg) |
| C 支撑与装配 | 加杆与 PCB 干涉等宽并排，拆杆状态、按键限位和侧键小板三图并列 | [拆杆与装配冲突](erste002-engineering-visual-evidence/history-support.jpg) |
| D 整机装配观察 | 总装和同阶段裸壳；按压翘起与旧结构纵剖；支撑与供电装配观察 | [整机与裸壳](erste002-engineering-visual-evidence/history-built.jpg) · [按键分析](erste002-engineering-visual-evidence/history-button.jpg) |
| E 最新 CAD 修改 | 当前 CAD 总览、三条跨阶段工程线、结构刚度、按键机构、电池安装、缝隙遮光 | [工程线索](erste002-engineering-visual-evidence/history-tracks.jpg) |
| 06 验证边界 | 汇总已完成的 CAD 与对应实体需要核对的性能 | [状态表](erste002-engineering-visual-evidence/history-current.jpg) |

阅读主部为 A–E。历史三段 B、C、D 的七个工程子段默认展开，照片和 CAD 依主题并排，段后用短条目交代设计意图、现场观察与下一步。刚度、按键与装配各自有 B → C → D → E 的四个跳转节点。补充图和历史 STL 归档放在折叠面板内。中文与英文均按相同事件、图位和证据边界编排。

## 图像覆盖

本轮有 44 个图位，新增九个历史图位 `IMG-H01` 至 `IMG-H09`。现有资料支撑 10 处临时照片或 STL 几何预览，其余 34 处用编号预留画幅。最终选图使用设计者提供的实拍、匹配事件的 CAD，或基于对应几何的标注图。逐图规格列出每个原图所需的阶段、机位、剖切、必须可见的结构及来源。

| 网页图位 | 当前临时素材 |
| --- | --- |
| IMG-O01 | IMG_4238，前方为红滚轮总装，后方为其他样件 |
| IMG-F01、F03、P01 | IMG_4241、4242、4244，未分件 FDM 的斜俯、侧视、正俯 |
| IMG-F02 | IMG_4237，FDM、原称「第二版」的无红滚轮样机、红滚轮实物 |
| IMG-P04、S01 | IMG_4240 中间的红滚轮样机及 IMG_4236 同阶段裸壳 |
| IMG-S07、S08、K02 | 收件包 P01、P04 的 STL 预览及 M007 按键盖，单独归档展示 |

首轮 MJF 与加杆 MJF 的原件映射仍待核对。未分件样件照片的改形前后身份未细分。红滚轮样机按压翘起、杆件偏弱和电池松动属定性实物观察。按键减重与厚度分配作为设计者的原因分析。最新 CAD 的真实截面、装配间隙、强度、刚度及耐久仍待对应图件或实体验证。

## 验收及交付

Edge 验收覆盖 1920×1080 中文、1440×900 英文的 20 个区段和专题视图。检查了 24 条追溯记录、12 个跨阶段跳转、44 个图号及直达链接、10 张图片解码、图片键盘操作、历史前进后退和语言切换。390px 完成排版冒烟检查。报告另列默认折叠状态下的章节高度，以复核 B–D 的展开篇幅。

构建、开场、目录、项目展示及公共能力检查通过。全站历史 Logo 审计的默认模型哈希仍与旧基线不符，使用既有当前基线的快速复查通过。交付在本地 `source`。修改内容配置后，执行 `node scripts/build-002-engineering-archive.mjs` 生成网页和素材规格。构建完成后使用 `npm run preview -- --port 5210 --strictPort` 预览。
