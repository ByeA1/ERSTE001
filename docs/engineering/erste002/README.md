# ERSTE002 工程设计演进档案

登记日期 2026-11-12。当前阶段为资料归档与核对，没有开发 ENGINEERING 网页。

## 阅读顺序

1. [设计者回忆与工程假设](designer-history.md) — 保留本次提供的历史，逐条编号。
2. [历代版本索引](revision-index.md) — REV00–REV03 的目标、工艺、验证、问题和缺失资料。
3. [收件与模型证据](evidence-register.md) — 四个 ZIP、七个 STL、哈希、可读性及归属边界。
4. [版本差异](version-differences.md) — 将回忆支持的演进与模型可观察差异分开。
5. [工程问题追踪](issue-tracker.md) — 发现版本、原因假设、修改和验证状态。
6. [待补证据](missing-evidence.md) — 后续补充资料清单。
7. [工程路线内容规划](engineering-route-plan.md) — 独立于 PRODUCT 的资料驱动路线。

结构化版本索引在 [revisions.json](revisions.json)，初次只读扫描元数据在 [model-inventory-2026-11-12.json](model-inventory-2026-11-12.json)。这两份文件只记录内容和元数据，不包含原始模型。

## 证据规则

- **设计者回忆**记录当事人的描述，不能等同于已经核对的模型事实或独立实物证据。
- **模型可观察事实**只说明指定文件的几何、命名或网格状态，不能证明打印工艺、受力性能、实测重量或实际装配成功。
- **实物测试证据**需要照片、视频、原始记录及对应版本。目前尚未收到这类文件。
- **工程假设**单独登记为待验证，不作为确认的失效原因。
- 2026-11-12 是此次登记日期。设计、打印、测试的实际日期均待确认，文件时间不替代事件日期。
- P01–P04 是收件包临时编号，M001–M007 是本次扫描的网格临时编号。**均不等同于 REV00–REV03**。稳定识别依据为完整 SHA-256 及原始路径。

## 本地资料位置

```text
D:\RhineTerminal\_archive\ERSTE002\
  REV00_FDM_手感验证\
  REV01_MJF_首次结构验证\
  REV02_MJF_支撑杆与装配验证\
  REV03_当前版本_待打印验证\
  UNSORTED_待分类\
  _derived\
    inventory-latest.json
    previews\
```

发现的原始包仍位于 `D:\RhineTerminal\_archive\1.zip` 至 `4.zip`，没有搬动或解压到上述正式版本目录。其项目与 REV 归属尚待确认。

原件保留原名。后续若需要重命名或转换，只生成有明确来源记录的派生副本，不能覆盖原件。无法判断版本时放入 UNSORTED，并补一份文字来源说明。建议说明设计者使用的版本名、实际打印批次、时间依据、原生单位和关联照片；未知项留空。

## 复用工具

在仓库根目录执行：

```powershell
python -X utf8 scripts/scan-002-engineering.py --init --inbox _archive
node scripts/render-002-engineering.mjs
```

扫描器只读原件，检查文件大小、修改时间和 SHA-256 在扫描前后是否一致；ZIP 成员直接在内存中读取，不解包到磁盘。可识别常见格式并明确报告读取程度。STL 支持网格测量，NX 原生文件不解码，STEP 只读头部，3MF 当前仅登记文件。

渲染器需要现有 Playwright 和 Edge；可用 `PLAYWRIGHT_MODULE_PATH` 指定已有 Playwright，不自动安装依赖。所有图像和运行报告仅输出到本地 `_derived`。正式生产构建不包含这些文件。

`inventory-latest.json` 和 `previews` 是当前工作副本。每次扫描另存到 `_derived/inventories/`，每组渲染按来源哈希与渲染器代码哈希保存到 `_derived/render-runs/`；既有快照不覆盖。新文件需重新扫描，来源哈希不一致时渲染器拒绝使用旧元数据。

新增资料后重新扫描；先核实来源和版本，再更新已登记的证据与版本关联。重新扫描不会自动把收件包提升为正式 REV，也不会自动改写已提交的历史记录。

## 本次验收

- 已创建要求的五个本地目录，正式版本目录目前没有被擅自填入候选模型。
- 四个原始 ZIP 的读取前后及渲染后 SHA-256、文件大小一致；ZIP 内七个 STL 完成只读解析与同机位渲染。
- 归档安全测试 6 项通过，覆盖不解压 ZIP、不猜版本、源文件不变、未知格式标记、网格开闭边及生产边界。
- 构建通过，21 项站点回归测试及 Logo 使用检查通过。产物版本仍为 `1c5ea666a93f312f`，归档原件和图像没有进入构建或离线缓存。
- 既有 Logo 保护审计仍因 `archive-cassette.glb` 哈希预期与现有模型不一致而失败；该资产与网站页面本轮没有修改。
