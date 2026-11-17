# ERSTE002 ENGINEERING｜第一阶段交付

本轮完成独立 PC 工程档案：序章、五章与结尾。第五章依据设计者最新原始记录，呈现已完成的 CAD 修改、每项修改回应的结构问题与设计逻辑，并保留整体刚度局限。最新版 CAD 文件未提供，按用户确认采用明确补图位。

## 预览与交付文件

- [完整档案](http://127.0.0.1:5208/cases/erste002/engineering.html)
- [第五章 DESIGN REFINEMENT](http://127.0.0.1:5208/cases/erste002/engineering.html#eng-refinement)
- [English](http://127.0.0.1:5208/cases/erste002/engineering.html?lang=en#eng-refinement)
- [正式中英文文案](D:/RhineTerminal/docs/2026-11-17-erste002-engineering-phase1-copy.md)
- [图片来源、版本、用途与补图清单](D:/RhineTerminal/docs/2026-11-17-erste002-engineering-phase1-media.md)
- [全部章节 PC 截图与第五章细节](D:/RhineTerminal/docs/2026-11-17-erste002-engineering-phase1-screenshots.md)
- [最终构建页面浏览器报告](D:/RhineTerminal/docs/erste002-engineering-phase1-evidence/browser-report.json)
- [原件及既有页面完整性核对](D:/RhineTerminal/docs/erste002-engineering-phase1-evidence/integrity.json)

地址仅供本机预览。重新启动时，在 `D:/RhineTerminal` 运行 `npm run preview -- --host 127.0.0.1 --port 5208 --strictPort`。如源码发生变化，先生成页面并重新构建。

## 实际结构与阅读方式

| 章节 | 叙事与证据 | 稳定 ID |
| --- | --- | --- |
| P / THE COST OF LIGHTNESS. | 红滚轮实体前景大图，以开放结构引出支撑、运动与装配关系 | `eng-prologue` |
| 01 / FORM FOLLOWS THE HAND | FDM 未分件样件、主观握持反馈、三代实物身份对照与外形变化 | `eng-form` |
| 02 / FROM FORM TO STRUCTURE | 分件、内部加强、首次 MJF 的刚度与孔位问题；当前裸壳只作相关结构参考 | `eng-structure` |
| 03 / THE ASSEMBLY TRADE-OFF | 历史 STL 同视角参考、增加支撑后的空间冲突、拆杆完成装配的历史记录 | `eng-assembly` |
| 04 / ENGINEERING CHALLENGES | 前版实体的整体偏软、按键倾斜/翘起与电池装配问题；区分现象、分析及影响 | `eng-challenges` |
| 05 / DESIGN REFINEMENT | 四项结构修改、三项按键原因与四项修正、电池向上装入与定位紧固、独立遮光细节 | `eng-refinement` |
| E / A MORE RESOLVED DESIGN. | 当前设计成果与尚存刚度边界，以简短结尾收束 | `eng-conclusion` |

右侧章节索引、底部上一章/下一章与进度支持独立线性阅读。专题和补图条目可精确定位；浏览器后退恢复离开时的实际阅读位置，前进与刷新同样保留阅读状态。真实图片可放大，支持左右切换、Esc 关闭及焦点恢复。三件样件 A/B/C 标识依实际图片位置放置。

第五章专题：`eng-refinement-structure`、`eng-refinement-button`、`eng-refinement-battery`、`eng-refinement-light-blocking`。四项结构子题为 `eng-refinement-structure-front`、`eng-refinement-structure-panels`、`eng-refinement-structure-edge`、`eng-refinement-structure-joint`。图位使用 `media-<图位 ID>`，补图条目使用 `request-Rxx`。本轮只预留稳定 ID，没有建立 PRODUCT 关联映射。

## 第五章的具体处理

结构部分逐项解释前部支撑杆、功能片体折边筋、开放底部边缘折边、主支撑杆与上盖连接区域。每项均有原有局限、已完成修改、设计逻辑和对应 CAD 对比要求。通用折边原理图解释局部截面与抗弯意图，不代表真实截面或整机抗扭测试。

按键部分依据设计者装配观察与结构回顾，解释片体刚度不足、后半连接板过度削减、弯折区与非弯折区厚度分配错位。新版通过片体折边、恢复连接与安装、保留必要镂空、重新分配厚度来控制预期弯折位置。功能分区示意不表示实际零件尺寸、实测位移或仿真场。

电池部分说明自下而上装入、内部上盖支撑、卡口定位与紧固。空间示意保留“桌面 → 电池 → 上盖内部支撑”的方位关系，没有暗示电池直接接触桌面，也没有虚构卡口形态。遮光作为独立专题，预留实际剖面与新旧对照，未代画未知结构。

## 图片与缺口

页面共 29 个视觉位置：10 处实物照片使用、2 处历史 CAD 参考、14 处明确占位和 3 处原生原理图。8 张正式入选照片全部使用；IMG_4236 与 IMG_4238 各出现两次，其余一次。10 张原件中的两张备选 IMG_4239、IMG_4243 未使用。大型原件、ZIP/STL 和历史资料仍留在 `_archive`，线上仅复用已有必要 WebP。

每个图位都有实际画面、版本、用途和理想补图四项说明。总共整理 21 项补图需求，按章节及优先级列出；第五章 11 项 P0 CAD 视图为：

| 编号 | 需要的视图 |
| --- | --- |
| R09 | 前部支撑杆同机位前后对照、连接位置及支撑区域 |
| R15 | 前部功能片体新增折边筋的内侧近景与局部剖视 |
| R16 | 开放底部边缘新旧截面对照、侧下视角 |
| R17 | 主支撑杆—上盖连接面积、几何与支撑范围对照 |
| R10 | 按键盖连接板后半段、安装关系与保留镂空 |
| R18 | 按键盖边缘新增折边及局部剖面 |
| R19 | 弯折区与非弯折区厚度分配的同位置剖面 |
| R20 | 历史异常运动与新版预期弯折位置的分别说明 |
| R11 | 电池向上装入的侧向剖面与下侧爆炸视角 |
| R21 | 卡口、定位面与紧固关系的安装后近景 |
| R12 | 按键盖—上盖遮光剖面、透光路径与运动间隙 |

每项具体机位、结构重点及用途见补图清单，可据此直接补图。

## 桌面浏览器验收

实际浏览器为 Microsoft Edge，使用本机浏览器的无界面模式执行。分别验收开发页面与构建后的 `5208` 页面；最终报告包含 17 项通过记录、28 张章节矩阵截图及 19 张细节/宿主截图。全部七个章节截图与第五章主要细节已实际查看。

| 检查 | 结果 |
| --- | --- |
| 1920×1080、1440×900，中英文全部七段 | 通过；内部滚动，无水平溢出 |
| 29 个图位、四项图注、版本和补图标识 | 通过 |
| 12 个图片位置解码，8 张实物照片来源可追溯 | 通过 |
| A/B/C 实物对照及留白区域定位 | 通过 |
| 图片放大、前后切换、Esc、焦点返回 | 通过 |
| 章节上一项/下一项、进度和首尾边界 | 通过 |
| 章节/专题/补图定位，后退/前进和刷新 | 通过 |
| 404 图片回退及重试 | 通过 |
| 禁用 JavaScript、禁用存储、异常片段地址、减少动态效果 | 通过 |
| 最新 CAD 已完成设计、尚无对应实测证据的区分 | 通过 |
| 宿主工具栏、语言消息与 Esc 隔离 | 测试替换页面验证通过；没有修改生产接入 |
| 不加载 PRODUCT 引擎、GLB 或独立 Three 运行时 | 通过 |

构建页面在本机首次打开至主图解码约 187 ms，DOMContentLoaded 约 161 ms，当时记录 5 个资源、约 763 KB 传输量。该记录是本机性能采样，不代表线上网络或所有延迟加载图片的总量。`html/css/js` 源文件与 `dist` 副本校验一致。

`npm run build`、开场时间线 10 项、项目目录 3 项、项目展示 5 项、默认公共能力 3 项，以及 Logo 使用检查通过。完整命令结果见 `required-checks.json`。

仓库原有全站 Logo 审计有独立异常，未报为通过：默认旧基准的 `archive-cassette.glb` 哈希与当前工作树不一致。使用本轮前已存在的当前基准诊断时，Chrome/Edge 桌面通过；两个移动端分支均在 ERSTE001 页面点击隐藏的旧语言控件时超时。原审计脚本、模型、统一导航和 ERSTE001 未为本轮修改。证据见 `build-and-legacy-audit.json`、`legacy-logo-audit-current-baseline.json`。

## 准确性边界与后续工作

最新 CAD 修改完成来自设计者的当前原始记录；没有新版文件可独立核对真实几何。11 处 CAD 位置保留明确占位，旧照片不冒充新版。前版红滚轮装配样机及 IMG_4235/4236 裸壳均属于最新 CAD 修改前的实体版本。P01—P04 收件包与照片、打印轮次、REV 的对应关系未确认，STL 单位未知。

没有最新版对应的 MJF 实物验证、刚度载荷/位移、按键功能或寿命、电池振动/跌落以及实物遮光记录。页面没有给出提升比例、实测位移场或“全部测试通过”的结论。整体刚度局限仍被保留。

移动端只有基础叠排规则，完整移动端排版和关键交互验收不在本阶段，未声称移动端验收通过。后续仍需补 CAD/照片、补充对应实体验证、完善手机端，再进行路线接入。当前独立页面没有通过现有 PRODUCT 入口自动进入；请使用本交付的直接地址。

## 源码与阶段封存

正式文案及图位配置位于 `content/erste002-engineering-phase1.mjs`，本次详细变更集中在 `content/erste002-engineering-refinement.mjs`。生成命令为 `node scripts/build-002-engineering-archive.mjs`，产出静态页面与文案/图位文档。样式和浏览逻辑分别位于 `engineering-archive.css`、`engineering-archive.js`。浏览器复核命令为 `ERSTE_ORIGIN=http://127.0.0.1:5208 node scripts/check-002-engineering-phase1.mjs`；PowerShell 请通过 `$env:ERSTE_ORIGIN` 设置地址。验证脚本复用本机既有的 `.audit/model-logo/tools/node_modules/playwright` 和 Microsoft Edge；洁净环境需另行准备测试工具。它们不进入线上页面，也未新增运行依赖。

本轮在本地 `source` 分支完成，起点为现有工作树 `a442f819607398e50bca58a2f7122dd1aca67133`。提交只包含本阶段新增文件。工作树中其他任务已有修改全部保留、没有并入本次提交。准确提交编号可由 `git log -1 --oneline -- public/cases/erste002/engineering.html` 查询。

14 份原始照片/历史 ZIP 与 222 个受保护的既有文件逐一 SHA-256 核对未变。PRODUCT 11 镜、ERSTE001、终端及统一导航保持本轮开始时状态。没有修改或部署 `main`，没有推送。

第一阶段以可独立阅读的 PC 工程档案封存。保留全部原件、历史模型、测试过程与最终通过证据；补图位、来源配置及稳定专题 ID 是恢复开发的入口。旧迭代截图和失败报告单独保留，最终验收以 `browser-report.json` 为准。
