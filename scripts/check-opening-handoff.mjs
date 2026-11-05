import test from 'node:test';
import assert from 'node:assert/strict';
import {openingHandoffAt,OPENING_HANDOFF_DURATION} from '../src/opening-handoff.ts';

test('film handoff begins at the rendered pose and ends at the interactive pose',()=>{
  assert.deepEqual(openingHandoffAt(0),{motion:0,ui:0,complete:false});
  assert.deepEqual(openingHandoffAt(OPENING_HANDOFF_DURATION),{motion:1,ui:1,complete:true});
  assert.equal(openingHandoffAt(-1).motion,0);
  assert.equal(openingHandoffAt(10).motion,1);
});
test('document waits for camera movement, then reveals without a jump or reversal',()=>{
  assert.equal(openingHandoffAt(.16).ui,0);
  assert.ok(openingHandoffAt(.16).motion>0);
  let previous=openingHandoffAt(0);
  for(let i=1;i<=110;i++){
    const cue=openingHandoffAt(i/100);
    assert.ok(cue.motion>=previous.motion&&cue.ui>=previous.ui);
    assert.ok(cue.motion-previous.motion<.025&&cue.ui-previous.ui<.025);
    previous=cue;
  }
  assert.equal(openingHandoffAt(.96).ui,1);
});
