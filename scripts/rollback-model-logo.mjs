import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
const root=fs.realpathSync('D:/RhineTerminal'),manifest=JSON.parse(fs.readFileSync(path.join(root,'.audit/model-logo/rollback-manifest.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
function target(relative){const dest=path.resolve(root,relative);if(path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..')||!dest.startsWith(root+path.sep))throw Error('Invalid rollback path');return dest;}
for(const item of manifest.files){const dest=target(item.path);if(!fs.existsSync(dest)||sha(fs.readFileSync(dest))!==item.afterSha256)throw Error('Later change detected; refusing rollback: '+item.path);if(item.beforeSha256){const backup=target('.audit/model-logo/originals/'+item.path);if(sha(fs.readFileSync(backup))!==item.beforeSha256)throw Error('Backup hash mismatch');}}
console.log(manifest.files.map(f=>(f.beforeSha256?'RESTORE ':'REMOVE ')+f.path).join('\n'));
if(!process.argv.includes('--apply'))console.log('Verified dry run. To apply this exact rollback: node scripts/rollback-model-logo.mjs --apply');
else for(const item of manifest.files){const dest=target(item.path);if(item.beforeSha256)fs.copyFileSync(target('.audit/model-logo/originals/'+item.path),dest);else fs.unlinkSync(dest);}
