# 2026-11-15 档案切换与控件整理

本轮保留在 `development/erste002-chapter-director`，HEAD `08dac92`。没有提交或推送，没有部署，没有修改 origin/main。工作树已有其他未提交成果，本轮未将其混入新提交。

## 档案切换

原问题：详情页上一/下一项目先执行 archive，再执行 detail，重走画质配置、退场/进场、文档揭示以及 1.25 秒关封面 + 1.25 秒开封面。切换并非单纯贴图更新。

现在：详情项目按钮和右侧项目目录使用原地选择路径，保留抬起状态、相机、画质及文档可见度。选择新的物理档案格时同时转移轨道原点，档案盒不在画面中跳位，返回仍对应正确项目。封面为同一平面材质的双贴图 320ms 交叉淡化；连续反向点击会沿现有混合状态反转。切换中返回保持淡化并继续原有关闭动画。进入/离开档案与开场仍沿用既有 1.25 秒封面展开/关闭。

两张封面在资源准备期间解码并预上传；不同项目之间换图不再要求材质程序重编译。仅在封面实际使用的拉丁字体就绪状态变化时重绘，不随每一个中文字体分片重绘所有 1600×910 封面。清理原文字动画控制器后再建立新项目文案，保留已有滚动字形效果。

实测：同机 Edge 无头浏览器，1440×900、系统完整画质、同一缓存环境。`baseline-switch.json` 与 `after-switch.json` 记录原始浏览器帧回调；不是 iPhone/4060 实机测试，也不是 GPU FPS 基准。

| 指标 | 修改前 | 修改后 |
|---|---:|---:|
| 点击至封面稳定 | 约2534ms | 约341ms |
| 完整画质画布 | 1440×900 | 1440×900 |
| 档案盒左上角位置 | — | 切换前后均为[88,288] |
| 最大浏览器回调间隔（单次） | 66.5ms | 54.6ms |
| P95浏览器回调间隔（单次） | 6.1ms | 8.1ms |

主要改进是消除重复场景切换和两次封面开合，未声称帧率全面提高。仍有个别较长回调，不能据此保证所有设备完全无卡顿。另三组独立检查覆盖桌面、390×844、320×568，封面稳定约333–353ms。

## 控件与推荐状态

- 手机底部工具组及语言按钮（包括选中/按下状态）完全透明；去掉底衬、边框、模糊和选中填充。工具、语言、重播保持44px高度和同一垂直对齐。
- 终端主要按钮采用档案海入口的茶色半透明玻璃、对角细线、独立箭头分区，文字在自身槽位居中。001/002返回按钮和002下一镜/回到开头采用同一结构，保留项目自身配色。未改变项目顶部栏的整体布局。
- 推荐UI不再混读DOM数据与偏好设置，统一由固定选择器状态、来源和详情上下文驱动。系统选择只在相应选中档位标注推荐；手动选择明确标注已选择与已保存，不覆盖其档位。系统推荐按钮在手动模式显示“使用系统推荐”，作为明确的用户操作。
- 复现“保存的平衡档 + 新推荐完整档”，确认显示手动平衡且不再在另一张卡片产生冲突的推荐标签。也覆盖首次系统推荐、详情临时升档、返回恢复和手动/自定义锁定。

## 文件与证据

核心：`src/main.ts`、`src/scene.ts`、`src/project-panel.ts`、`src/project-cover-motion.ts`、`src/quality-settings.ts`。
控件：`src/terminal-controls.css`、`src/action-buttons.css`、`src/site-navigation.ts`、`src/site-navigation.css`、`public/cases/erste002/index.html`、`public/cases/erste002/story-action-buttons.css`。

证据目录：`D:\RhineTerminal\.audit\commands-switch-20261115\`。
- `before/`、`after/`、`manifest.json`：按本轮起点保留源文件与哈希，可逐文件回滚；不要用旧快照覆盖之后新增的工作。
- `baseline-switch.json`、`after-switch.json`、`runtime.json`：同机前后及三种布局检查。
- `project-commands.json`：两款项目的文字居中、主题玻璃、返回和中断切换检查。
- `desktop-full-after.png`、`phone-detail.png`、`small-en.png`：详情及手机透明底部控件。
- `phone-erste002-toolbar-en.png`、`desktop-erste002-project.png`：项目主题按钮。

## 验证

通过：
- `npm run build`（最终本地构建 d8f75f5e8f4fee23）。
- opening timeline / catalogue / presentation / logo usage / project defaults / quality recommendation 静态检查。
- `node --experimental-strip-types --test scripts/check-cover-print-motion.mjs`。
- `node scripts/check-command-switch-runtime.mjs`：1440、390、320三组，连续切换、反向连点、目录、无质量缓冲重建、无详情退场、文字对齐、推荐来源、透明与平齐、返回重新打开。
- `node scripts/check-project-command-runtime.mjs`：桌面/手机，001和002实际页面，主题色/玻璃/细线框、文字居中、中英文、返回、中断淡化后关闭与恢复。
- `node scripts/check-settings-language-runtime.mjs`：三组布局，语言完整性、参数、焦点、滚动状态保留。
- `node scripts/check-quality-cover-runtime.mjs`：构建产物三组布局，四档/自定义、保存恢复、两款档案盒完整封面、拆解/装回、002策略继承。

已有失败：`node scripts/audit-logo-unification.mjs` 在保护模型哈希处失败。archive-cassette.glb 当前与HEAD均为94fc4714…，旧审计期待dda42b9b…；本轮没有修改模型或此审计基线。构建仍提示原有较大JS包，不在本轮扩大拆包范围。

本地预览：http://127.0.0.1:5201/ 。手机结果为Chromium触摸模拟，尚无真实iPhone Safari/用户4060设备验收数据。
