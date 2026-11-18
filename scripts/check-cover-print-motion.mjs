import assert from 'node:assert/strict';import {test} from 'node:test';import {ProjectCoverMotion} from '../src/project-cover-motion.ts';
test('changing the printed project preserves the partially opened physical cover',()=>{
 const m=new ProjectCoverMotion();m.select('erste001');m.update(.4);const before=m.frame;m.replace('erste002');assert.equal(m.frame.amount,before.amount);assert.equal(m.frame.phase,'opening');assert.equal(m.frame.id,'erste002');m.update(1);assert.equal(m.frame.phase,'open');
});
test('returning during a project transition keeps the original reversible closing timing',()=>{
 const m=new ProjectCoverMotion();m.select('erste001',true,false);m.replace('erste002');m.select(undefined);m.update(.5);assert.equal(m.frame.id,'erste002');assert.equal(m.frame.phase,'closing');const amount=m.frame.amount;m.select('erste002');assert.equal(m.frame.amount,amount);m.update(1);assert.equal(m.frame.phase,'open');m.select(undefined);m.update(1.25);assert.equal(m.frame.phase,'closed');
});
