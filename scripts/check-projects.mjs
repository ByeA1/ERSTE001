import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const registry = JSON.parse(await readFile('content/projects.json', 'utf8'));
const archives = JSON.parse(await readFile('content/archives.json', 'utf8'));
const ids = new Set();
if (!Array.isArray(registry.projects) || !registry.projects.length) throw Error('项目配置不能为空');
for (const project of registry.projects) {
  if (!/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id)) throw Error(`项目 ID 无效或重复：${project.id}`);
  ids.add(project.id);
  if (typeof project.title !== 'string' || !project.title.trim() || !/^[A-Z0-9-]{1,12}$/.test(project.number)) throw Error(`项目标题或编号无效：${project.id}`);
  if (project.shortcut !== undefined && typeof project.shortcut !== 'boolean') throw Error(`shortcut 必须为布尔值：${project.id}`);
  if (project.page !== null) {
    if (typeof project.page !== 'string' || !/^\/cases\/[a-zA-Z0-9_/-]+\.html$/.test(project.page) || project.page.includes('..')) throw Error(`page 必须是 /cases/ 下的本站 HTML 路径：${project.id}`);
    const file = await stat(resolve('public', project.page.slice(1))).catch(() => null);
    if (!file?.isFile()) throw Error(`项目页面不存在：${project.page}`);
  }
  if (project.externalUrl && new URL(project.externalUrl).protocol !== 'https:') throw Error(`外链必须为 HTTPS：${project.id}`);
}
for (const record of archives.records) {
  if (record.projectId && !ids.has(record.projectId)) throw Error(`档案 ${record.id} 引用了未注册项目 ${record.projectId}`);
  if (record.section && !/^[A-Za-z][\w:.-]{0,79}$/.test(record.section)) throw Error(`章节 ID 无效：${record.id}`);
}
console.log(`Project integration checked: ${ids.size} projects, ${archives.records.length} archive links.`);
