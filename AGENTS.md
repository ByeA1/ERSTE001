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

## 交付习惯

- 改完跑三套校验 + `npm run build`，都通过再交。
- 说明改了什么、影响哪几页、有没有动线上产物。
