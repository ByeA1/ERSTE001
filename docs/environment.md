# 站点环境实测记录

记录时间：2026-11-04（北京时间）。所有条目均为实测，不是推测。

## 线上

- 域名：https://www.zlf666.xyz ，HTTP 200。
- 托管：GitHub Pages，响应头 `Server: GitHub.com`、Fastly 缓存、`Cache-Control: max-age=600`。
- 仓库：`ByeA1/ERSTE001`（公开），默认分支 `main`。
- Pages 配置：`build_type: legacy`，来源 `main` 分支 `/`（仓库根目录），自定义域 `www.zlf666.xyz`，证书已签发（到期 2026-12-11），未强制 HTTPS。
- 最近一次构建：commit `f4ef0b7`，2026-09-16T15:01:09Z 起，耗时 86 秒，状态 built。
- DNS：`www.zlf666.xyz` CNAME → `beyea1.github.io`；直接访问该地址返回 404（用户名大小写与实际 `ByeA1` 不符时不影响 Pages 的自定义域路由）。

## 本地

- 路径：`D:\Portfolio-TheFinal`。
- 迁移前的状态：只有 `master`，两个本地提交（2026-09-16），**没有 remote**，`script.js` 有未提交改动，没有 `CNAME`（远端根目录有）。
- 迁移前本地与远端是两条无关的历史：本地 37 个文件，远端 39 个（多 `CNAME`、`LICENSE`）。
- 忽略空白差异后，`index.html`、`style.css` 与远端一致（差异全部来自 CRLF/LF）；`script.js` 存在真实内容差异。
- 已处理：本地改动冻结在分支 `archive/local-20260916`，工作副本快照另存于 VVA 侧 `work/collab/artifacts/`；`main` 重建为跟踪 `origin/main`；仓库配置 `core.autocrlf=false`、`core.eol=lf`，并加入 `.gitattributes`。

## 部署链路（已验证）

推送到 `main` → GitHub Pages legacy 构建 → 自动上线，通常 60–120 秒。
回滚方式：`git revert` 到上一个提交并推送，或把 `main` 强制指回上一个已知良好提交再推送；两种都会触发重新构建。

## 凭据

本机已安装 GitHub CLI（`gh` 2.103.3），通过设备码授权登录为 `ByeA1`，token 存于系统密钥环，作用域 `gist`、`read:org`、`repo`。未在任何文件或日志中保存明文凭据。
