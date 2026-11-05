# ERSTE — 设计终端与项目档案

个人作品集站点：一个莱茵实验室风格的三维「档案终端」首页，加两个项目档案（ERSTE001 指握鼠标、ERSTE002 低矮壳体结构）。

技术栈：Vite 5 + TypeScript + Three.js 0.170 + GSAP 3.12，纯静态构建，无后端。

> 上游项目说明（原版 Rhine Lab 复刻文档）保留在 `docs/UPSTREAM-README.md`。

## 快速开始

```bash
npm ci          # 安装依赖（Node 20+）
npm run dev     # 本地开发，默认 http://127.0.0.1:5173
npm run build   # 产出 dist/，可直接静态托管
npm run preview # 预览构建结果
```

提交前跑校验脚本：

```bash
node --experimental-strip-types --test scripts/check-opening-timeline.mjs
node scripts/check-project-catalogue.mjs
node scripts/check-project-presentation.mjs
```

## 目录结构

```
src/                 终端外壳：开场序列、档案阵列、项目面板、PWA
  main.ts            入口；开场时间轴、模式切换、启动流程
  boot*.ts           开场分镜与节奏（加载 → 授权 → 欢迎 → 档案入场）
  project-*.ts       项目选择、案例查看（iframe）、封面、目录
  scene.ts           三维档案装置（GLB + 灯光 + 后期）
public/
  cases/erste001/    ERSTE001 完整案例页（自带样式与图片）
  cases/erste002/    ERSTE002 案例页 + 三维查看器 + 模型
    assets/shell-hi.glb   94.7k 面 Draco 模型（319KB），三件：上盖 / 按键盖 / 底板
    vendor/               本地 three、DRACOLoader 与解码器（不依赖外链）
    story.json            滚动讲解的章节数据
  assets/            档案装置模型 archive-cassette.glb 等
  fonts/             MiSans 全量分片（753 个 woff2，23.3MB）
content/
  projects.json      项目注册表：id / 编号 / 标题 / 页面 / 封面
  archives.json      档案记录（标题、摘要、分类、关联项目）
scripts/             构建期校验与 PWA 清单生成
docs/                设计记录、待办、参考
```

## 部署

线上是 GitHub Pages（自定义域名 `www.zlf666.xyz`），托管的是**构建产物**；仓库 `main` 分支即产物。
源码在本仓库的 `source` 分支。改动流程：改源码 → `npm run build` → 产物同步到 `main` → 推。

## 已知问题

见 `docs/PENDING.md`。要点：Service Worker 预缓存了 753 个字体分片（23MB），新访客首访会被后台下载拖慢；`_template` 目录因 Jekyll 被忽略，导致 `sw.js` 预缓存失败；档案装置 GLB 冷启动约 8 秒。

## 协作约定（重要）

- 只改 `src/` 与 `public/`；不要动 `main` 分支上的构建产物（那是线上）。
- 案例页会被终端以 iframe 打开：页面里**不能出现 `id="stage"`**（与终端冲突，会被判为加载失败）；滚动请用页面内滚动容器，不要依赖 `window.scrollY`。
- 品牌信息统一为 `albert_z0413@hotmail.com`。
- ERSTE002 高亮规则：讲解时**只用灯光**打光，材质颜色与自发光保持不变；仅允许在聚焦前用自发光闪两下作提示。
- 滚动讲解方案与最新决定见 `docs/002-scroll-story-plan.md`（顶部的决定优先，旧五章分镜已取消）。
