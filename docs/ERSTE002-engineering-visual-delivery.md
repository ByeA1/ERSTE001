# ERSTE002 ENGINEERING｜结构路线复盘与页面交付

[本地中文版](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=zh&view=route-review#eng-overview) · [本地英文版](http://127.0.0.1:5210/cases/erste002/engineering.html?lang=en&view=route-review#eng-overview) · [工程事件追溯表](ERSTE002-engineering-traceability.md) · [最终图片规格](ERSTE002-engineering-final-media-spec.md)

工程档案跟随五版设计的实际事件，呈现薄壁筋板的减料假设怎样经受实体制造和装配检查。设计者认为后部筋板相对有效，前部开口和安装区却使载荷路径不连续。跨接杆增加了支撑，也增加接口并与 PCB 争用装配空间。就 ERSTE002 的几何与装配需求，设计者倾向采用传统上下壳作为后续方向。两种结构尚无同条件重量或刚度对照。

## 结构与阅读顺序

| 区段 | 页面内容 | 桌面截图 |
| --- | --- | --- |
| 00 概览 | 红滚轮实体主图、开放底部的设计背景和 A–E 导航。 | [概览](erste002-engineering-visual-evidence/route-1920-zh-overview.jpg) |
| A 初始假设 | 未分件 FDM 与已辨认样件同框。握持与改形独立构图，交代试握怎样确定右手非对称曲面。 | [外形与假设](erste002-engineering-visual-evidence/route-1920-zh-form.jpg) |
| B 初期验证 | 分件、首轮 MJF、内筋与装配基准分别说明。后部局部收益与前部传力限制同首次实物刚度、对孔观察并读。01、02 号包做独立的同机位几何对照。 | [分件与 STL](erste002-engineering-visual-evidence/route-1920-zh-evolution.jpg) · [筋板与孔位](erste002-engineering-visual-evidence/route-1920-zh-early-fit.jpg) |
| C 支撑取舍 | 解释跨接支撑的作用意图、PCB 干涉和拆杆后的装配结果。按键盖、微动、抬起限位、侧键小板和电池固定形成独立检查条目。03、04 号包几何并列。 | [支撑和 PCB](erste002-engineering-visual-evidence/route-1920-zh-support.jpg) · [拆杆与机构配合](erste002-engineering-visual-evidence/route-1920-zh-support-checks.jpg) |
| D 整机迭代 | 红滚轮总装和同阶段裸壳等宽。分开展示杆件偏弱、按键盖的实物翘起与设计者归因，以及电池装入与到位保持。 | [整机与裸壳](erste002-engineering-visual-evidence/route-1920-zh-built.jpg) · [按键翘起](erste002-engineering-visual-evidence/route-1920-zh-built-button.jpg) |
| E 最终修订 | 分别记录四项刚度修订、按键厚度和连接板、底部向上装入的电池路径。取消的卡扣和遮光在范围说明中点明。05 号包的网格与总装图位分别标识。 | [最终修订](erste002-engineering-visual-evidence/route-1920-zh-decisions.jpg) |
| 06 路线复盘 | 用裸壳前部实拍定位开口和安装区域。总结开放底部的取舍、传统上下壳的后续方向及验证边界。 | [中文结论](erste002-engineering-visual-evidence/route-1920-zh-current.jpg) · [英文结论](erste002-engineering-visual-evidence/route-1440-en-current.jpg) |

主线公开显示设计动作和观测结果。详细图组按主题展开，图号深链接可直接打开所属图组。刚度、按键、装配各有 B → C → D → E 的工程线索。工程说明中的结构解释与实物验证状态分别呈现。

## 图像与来源

平台共 46 个图位。本轮沿用或生成 14 张临时图片，其中 8 张实拍、6 张由原始 STL 渲染。其余 32 处以图号、画幅与短图注预留。逐图规格包含来源阶段、机位、比例、必见几何和标注。正式制作以设计者提供且经核对的图片为准。

| 图号 | 当前实际素材 |
| --- | --- |
| IMG-O01 | IMG_4238，前景为红滚轮总装。 |
| IMG-F01、F03、P01 | IMG_4241、IMG_4242、IMG_4244，FDM 样件的斜俯、侧视和正俯。 |
| IMG-F02 | IMG_4237，FDM、原称「第二版」的无红滚轮样机、红滚轮实物。 |
| IMG-P04、S01、Q01 | IMG_4240 中央红滚轮样机、IMG_4236 同阶段裸壳内侧、IMG_4235 裸壳前部。 |
| IMG-S07、H10、H11、S08、H12 | 1–5 号包的原始网格，同正交机位及裁切，无逐包缩放。五张 WebP 合计约 94 KiB。 |
| IMG-K02 | 4 号包的 M007 按键盖内侧几何，仍需核对与发生翘起的实体的关系。 |

五个 ZIP 共九个 STL。1 至 4 号包与原有归档的哈希一致，5 号包包含上盖 1.7.1 和按键盖 1.7.2。收件包、样件、正式版次与打印轮次的对应关系仍有待核对。网格和静态照片仅用于说明可见几何，未用工程绘图代替实物观测。最终 CAD 全套视图按 IMG-P05、IMG-C01 等卡片补充。 [STL 核验与派生预览记录](erste002-engineering-visual-evidence/route-stl-audit.json)

## 验收和复现

- Edge 检查了 1920×1080 中文、1440×900 英文各 19 个页面位置，覆盖 26 条追溯记录、12 个跨阶段跳转、46 个图号与 14 张图片。确认图位深链、语言切换、键盘与放大、进度、浏览器前进与后退。390px 完成独立档案冒烟检查。 [浏览器报告](erste002-engineering-visual-evidence/route-browser-report.json)
- 中文可见正文的单段最长控制在 75 个非空白字符以下。以同一段落统计口径与重构前快照相比，正文从中文 3,446、英文 9,777 个非空白字符降至 1,397 和 3,474。详细照片说明和取图条件集中于逐图规格。 [重构前统计](erste002-engineering-visual-evidence/text-before.json)
- 构建、开场时间线、目录、项目展示及公共能力检查通过。默认全站 Logo 审计使用的旧基线与既有终端卡带模型哈希不符。按当前基线复查时，ERSTE001 移动端宿主语言按钮的点击超时。两个问题位于工程档案范围之外。
- 14 件项目原始归档、5 个收件包与 5 张派生图按哈希复核。PRODUCT 和统一顶部导航的相关文件相对开发基线无差异。
- 修改文案或图位配置后，执行 `node scripts/build-002-engineering-archive.mjs` 生成网页和逐图规格。使用 `npm run build` 和 `npm run preview -- --port 5210 --strictPort` 本地预览。浏览器回归入口为 `node scripts/check-002-engineering-visual.mjs`。

最终 CAD 已完成设计修改。对应实物还未打样，整体刚度、按压轨迹与持续使用表现、电池实际装配及保持仍待验证。项目以本轮工程路线复盘暂告一段落。
