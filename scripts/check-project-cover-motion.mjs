import test from 'node:test';
import assert from 'node:assert/strict';
import {ProjectCoverMotion,PROJECT_COVER_DURATION} from '../src/project-cover-motion.ts';

test('opening stays primed until the existing cue, then reveals over the original duration',()=>{
  const cover=new ProjectCoverMotion();
  cover.select('erste001',false);
  cover.update(10);
  assert.equal(cover.frame.phase,'primed');
  assert.equal(cover.amount,0);
  cover.reveal();
  cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.amount,.5);
  cover.reveal(); // The opening calls this cue every frame.
  cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.amount,1);
});
test('return keeps the same cover while closing and releases it only at the closed endpoint',()=>{
  const cover=new ProjectCoverMotion();
  cover.select('erste002',true,false);
  cover.select(undefined);
  assert.equal(cover.frame.phase,'closing');
  assert.equal(cover.activeId,'erste002');
  assert.equal(cover.amount,1);
  cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.activeId,'erste002');
  assert.equal(cover.amount,.5);
  cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.activeId,undefined);
  assert.equal(cover.frame.phase,'closed');
});
test('closing retraces the exact opening wipe',()=>{
  const opening=new ProjectCoverMotion(),closing=new ProjectCoverMotion();
  opening.select('erste001');
  closing.select('erste001',true,false);closing.select(undefined);
  opening.update(PROJECT_COVER_DURATION*.25);
  closing.update(PROJECT_COVER_DURATION*.75);
  assert.equal(opening.amount,closing.amount);
});
test('quick return and re-entry reverse from the current picture without a reset',()=>{
  const cover=new ProjectCoverMotion();
  cover.select('erste001');cover.update(.6);
  const partial=cover.amount;
  cover.select(undefined);
  assert.equal(cover.amount,partial);
  cover.update(.2);
  const returning=cover.amount;
  assert.ok(returning>0&&returning<partial);
  cover.select('erste001');
  assert.equal(cover.amount,returning);
  cover.update(PROJECT_COVER_DURATION);
  assert.equal(cover.amount,1);
});
test('another project never replaces the texture on a partially open cover',()=>{
  const cover=new ProjectCoverMotion();
  cover.select('erste001',true,false);
  cover.select('erste002');cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.activeId,'erste001');
  cover.update(PROJECT_COVER_DURATION/2);
  assert.equal(cover.activeId,'erste002');
  assert.equal(cover.amount,0);
  cover.update(PROJECT_COVER_DURATION);
  assert.equal(cover.amount,1);
});
test('replay primes afresh and reduced motion applies the endpoint immediately',()=>{
  const cover=new ProjectCoverMotion();
  cover.select('erste001',true,false);
  cover.select('erste001',false);
  assert.equal(cover.frame.phase,'primed');
  assert.equal(cover.amount,0);
  cover.reveal(false);
  assert.equal(cover.amount,1);
  cover.select(undefined,true,false);
  assert.equal(cover.amount,0);
  assert.equal(cover.activeId,undefined);
});
