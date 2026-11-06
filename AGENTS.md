# AGENTS.md — ERSTE 站点

## 这是什么

个人作品集站点：莱茵实验室风格的三维「档案终端」首页 + 两个项目档案。Vite + TypeScript + Three.js + GSAP，纯静态。

## 命令

- 安装：`npm ci`
- 开发：`npm run dev`（127.0.0.1:5173）
- 构建：`npm run build` → `dist/`
- 预览：`npm run preview`
- 校验（改完务必跑）：
  - `node --experimental-strip-types --test scripts/check-opening-timeline.mjs`
  - `node scripts/check-project-catalogue.mjs`
  - `node scripts/check-project-presentation.mjs`

## 结构

- `src/` 终端外壳（开场、档案阵列、项目面板、PWA）
- `public/cases/erste001/` 001 案例页（独立完整页面）
- `public/cases/erste002/` 002 案例页 + 三维查看器 + Draco 模型 + `story.json`
- `content/projects.json`、`content/archives.json` 内容注册表
- `docs/` 设计记录与待办（先读 `docs/PENDING.md` 与 `docs/002-scroll-story-plan.md`）

## 唯一基线（2026-11-06 起）

- 本仓库 `source` 分支 = `D:\RhineTerminal` 工作树，是**唯一开发基线**。
- `C:\Users\Saki\.openclaw\workspace\sites\rhine-terminal` 是历史工作区，只作性能方案参考，不要再在上面改站点代码。
- 线上 = `main` 分支（构建产物），由 `D:\Portfolio-TheFinal` 推送，禁止直接改。

## 硬性约束

1. **不要改 `main` 分支**：那是线上构建产物，GitHub Pages 直接托管。
2. 案例页运行在终端的 iframe 里：
   - 禁止出现 `id="stage"`（与终端冲突，会被判为加载失败）。
   - 滚动用页面内滚动容器（`#scroller`），不要依赖 `window.scrollY`。
3. 品牌信息统一 `albert_z0413@hotmail.com`。
4. ERSTE002 高亮只用灯光；自发光仅用于聚焦前的提示闪烁（两次），不得作为高亮手段。
5. 002 滚动讲解：以 `docs/002-scroll-story-plan.md` 顶部决定为准，旧五章分镜已取消，不要直接实施。
6. 字体是 MiSans 全量分片，改动 PWA 预缓存清单时要留意体积（当前把 753 个分片全缓存了，是已知问题）。

## 新项目默认继承公共能力

- 新项目按现有注册表/档案内容接入，使用 `public/cases/_template/index.html` 的声明式内容结构；不要再逐页复制加载、语言、返回、Logo 或暂停恢复脚本。
- 所有项目由 `project-viewer.ts` 默认装配 `ProjectLoading` 和 `ProjectInterface`，不按 001/002 等项目名硬编码公共能力。新公共优化应改共享层，并验证未列举过的项目也生效。
- 页面内需要莱茵图形 Logo 时使用模板已有的 `[data-rhine-logo]` 容器，宿主自动装配 `rhine-logo.ts` 中已确认的 SVG / 6.4 秒轨迹。不要复制静态 UI SVG 或另做动画。实体印刷、图标和产品照片保持静态。
- 双语正文用 `data-zh` / `data-en`；返回控件用 `data-project-close`。模板已包含这些默认能力，无需项目初始化 JS。
- 自定义异步引擎仍负责自己的内容：声明 `body[data-project-ready="loading"]`，就绪/失败时设为 `ready` / `failed`；沿用统一 `design-terminal:pause/resume`、`case-policy` 协议。不得通过修改全局 RAF 或强制改所有 Three 材质来伪造通用暂停/降级。
- 必须运行 `node scripts/check-logo-usage.mjs`、`node --test scripts/check-project-defaults.mjs`、`node scripts/audit-logo-unification.mjs`；不要为了新增项目再去补共享层项目 ID 白名单。细节见 [公共能力交付说明](docs/2026-11-06-logo-public-services.md)。

## 交付习惯

- 改完跑三套校验 + `npm run build`，都通过再交。
- 说明改了什么、影响哪几页、有没有动线上产物。
