# 给 VVA：项目页面接入说明

项目入口已经配置化，ERSTE001 使用同一个通用查看器。接入新项目不需要修改 `src/main.ts` 或查看器。

## 1. 放入页面

将页面和资源放到 `public/cases/<项目id>/`。可以复制 `public/cases/_template/index.html` 开始，也可以放入已有完整 HTML、CSS、JS 和图片。使用相对资源路径，页面会在终端内展开；顶层地址不会改变。

## 2. 注册项目

编辑 `content/projects.json` 的 `projects` 数组，例如：

```json
{
  "id": "erste003",
  "number": "003",
  "title": "ERSTE003",
  "page": "/cases/erste003/index.html",
  "shortcut": true
}
```

`id` 是唯一且稳定的标识。`shortcut: true` 自动生成桌面首页快捷入口；手机端仍通过档案入口打开。`page: null` 表示尚未接入，不会加载不存在的页面；可选 `externalUrl` 保留原有外链。ERSTE002 当前处于这个预留状态，之后将 `page` 改为实际本站路径即可启用内嵌页面。

## 3. 关联三维档案

在 `content/archives.json` 对应记录中加入：

```json
{
  "projectId": "erste003",
  "section": "overview"
}
```

这是已有档案记录的两个字段，其他标题、分类、摘要等必填字段沿用现有记录。`section` 可省略；提供时填写页面元素的 `id`，不带 `#`。例如 `s03`、`overview`。点击档案后会打开该项目并定位章节。

当前保留五列阵列布局，每列可有 1–20 份档案，列内数量无需相同。新增记录的 `id` 按现有 `X-001` 格式顺序递增；分类需属于现有 `columns`。首页刻度和总数会自动更新。只注册顶部快捷入口时，不必增加档案记录。

## 4. 返回与跨项目调用

查看器自带“返回终端”按钮，关闭后保留原选档并恢复焦点。每个项目保留各自的滚动和语言状态。页面内部的按钮或 Escape 可以发送：

```js
parent.postMessage({ type: 'design-terminal:close-project' }, location.origin);
```

从当前项目请求打开另一个已注册项目：

```js
parent.postMessage({
  type: 'design-terminal:open-project',
  projectId: 'erste003',
  section: 'overview'
}, location.origin);
```

只接受当前显示项目页面发出的同源消息，不接受任意网址。模板已包含返回按钮和 Escape 示例。

终端侧其他组件可以导入 `openProject` / `closeProject`（`src/project-viewer.ts`），或使用：

```js
window.DesignTerminal.openProject('erste003', 'overview'); // 成功打开返回 true
window.DesignTerminal.closeProject();
```

未注册或尚无 `page` 的项目返回 false，不跳转网页。

## 5. 验证和交付

```text
npm ci
npm run check:projects
npm run build
npm run preview
```

构建前会检查重复 ID、缺失页面、错误章节格式和未注册项目引用；`public/cases/` 下的页面及常见资源类型会自动进入发布包和离线缓存。

本轮未将 ERSTE002 迁入终端，未改动正式域名。当前公开版本：
https://tony-zhang-rhine-terminal.fuzzycatkin.chatgpt.site
