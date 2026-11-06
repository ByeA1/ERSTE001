import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = fs.realpathSync('D:/RhineTerminal');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.audit/logo-unification/rollback.json'), 'utf8'));
function target(relative) {
  const file = path.resolve(root, relative);
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..') || !file.startsWith(root + path.sep)) throw Error('Invalid rollback path');
  return file;
}
for (const item of manifest.files) {
  if (!fs.existsSync(target(item.path)) || sha(fs.readFileSync(target(item.path))) !== item.after) throw Error('Later edit detected; refusing rollback: ' + item.path);
  if (item.before && sha(fs.readFileSync(target('.audit/logo-unification/before/' + item.path))) !== item.before) throw Error('Backup mismatch: ' + item.path);
}
console.log(manifest.files.map(item => (item.before ? 'RESTORE ' : 'REMOVE ') + item.path).join('\n'));
if (!process.argv.includes('--apply')) console.log('Dry run verified. Add --apply to restore the state before this round only.');
else for (const item of manifest.files) {
  if (item.before) fs.copyFileSync(target('.audit/logo-unification/before/' + item.path), target(item.path));
  else fs.unlinkSync(target(item.path));
}
