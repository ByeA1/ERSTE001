import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {chapters,topics,productToTopic,parseRoute} from '../public/cases/erste002/engineering-content.js';
import {renderArchive} from '../public/cases/erste002/engineering-view.js';
const assets=JSON.parse(readFileSync(new URL('../public/cases/erste002/engineering-assets.json',import.meta.url)));
assert.equal(chapters.length,4);assert.equal(new Set(topics.map(t=>t.id)).size,topics.length);
assert.deepEqual(productToTopic,['overview','grip','form','hold','open','assembly','reinforcement','ribs','stiffness','buttons','status']);
for(const t of topics){assert.ok(chapters.some(c=>c.id===t.chapter));assert.ok(t.shot>=1&&t.shot<=11);assert.equal(t.label.length,2);assert.deepEqual(parseRoute('#engineering/'+t.id),{route:'engineering',topic:t.id});}
for(const hash of ['#engineering/fake','#product/00','#product/12','#product/NaN','#engineering/<script>'])assert.deepEqual(parseRoute(hash),{route:'product',shot:1});
const markup=renderArchive(assets);
assert.equal((markup.match(/data-topic="/g)||[]).length,topics.length);
assert.equal((markup.match(/class="e-chapter"/g)||[]).length,4);
for(const t of topics)assert.ok(markup.includes(`data-related-product="${t.id}"`));
assert.equal(assets.photos.length,8);
for(const p of assets.photos){assert.match(p.sha256,/^[a-f0-9]{64}$/);for(const v of p.variants)assert.ok(existsSync(new URL('../public/cases/erste002/assets/engineering/'+v.file,import.meta.url)));}
assert.ok(!markup.includes('D:\\'));assert.ok(!markup.includes('_archive/'));
console.log('PASS: linked content graph, 11 shot targets, 15 topics, bilingual metadata, 8 sourced photos and safe route parsing');
