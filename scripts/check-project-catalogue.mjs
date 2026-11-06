import assert from 'node:assert/strict';
import test from 'node:test';
import {records,archiveColumns,columnFiles,fileLocation} from '../src/data.ts';
import {fileAtCell,selectionCell} from '../src/archive-loop.ts';
import {projects as registry} from '../src/projects.ts';

test('gamingmouse contains every registered whole project; four other collections are reserved',()=>{
  const projects=records.filter(record=>!record.placeholder);
  assert.deepEqual(projects.map(record=>record.title),registry.map(project=>project.title));
  assert.deepEqual(projects.map(record=>record.id),registry.map(project=>`X-${project.number}`));
  assert.equal(records.filter(record=>record.placeholder).length,4);
  assert.ok(records.filter(record=>record.placeholder).every(record=>!record.projectId));
  assert.ok(records.every(record=>!record.section));
  assert.equal(archiveColumns.length,5);
  assert.equal(fileLocation(0).lane,2);
});
test('the original five-column sea has valid project records across distant cells',()=>{
  for(let lane=-15;lane<=15;lane++)for(let row=-70;row<=70;row++){
    const index=fileAtCell({lane,row});
    assert.ok(Number.isInteger(index)&&index>=0&&index<records.length);
    assert.equal(fileAtCell({lane:lane+5,row:row+columnFiles(lane).length}),index);
  }
  for(let lane=0;lane<5;lane++){
    const files=columnFiles(lane);
    assert.equal(files.length,lane===2?registry.length:1);
    assert.ok(files.every(i=>lane===2?!records[i].placeholder:records[i].placeholder));
  }
});
test('up/down selection retains physical direction across project wraparound',()=>{
  for(const direction of [-1,1]){
    let cell={lane:2,row:12};let index=0;
    for(let step=0;step<50;step++){
      index=(index+direction+registry.length)%registry.length;
      const next=selectionCell(index,cell,{axis:'row',direction});
      assert.equal(next.row-cell.row,direction);
      assert.equal(fileAtCell(next),index);
      cell=next;
    }
  }
});
