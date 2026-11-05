import assert from 'node:assert/strict';
import test from 'node:test';
import {OpeningTimeline, openingAt, OPENING} from '../src/opening-timeline.ts';
import {extraction} from '../src/motion.ts';
import {PROJECT_COVER_OPENING_START,PROJECT_COVER_DURATION} from '../src/project-cover-motion.ts';
const run=(clock,from,to,ready=true)=>{for(let time=from+1/60;time<to;time+=1/60)clock.advance(time,ready);return clock.advance(to,ready);};

test('fast resources preserve every phase and the full continuous duration',()=>{
  const clock=new OpeningTimeline();clock.restart(100);
  const phases=[];
  for(let i=0;i<=Math.ceil(OPENING.end*60);i++){
    const state=clock.advance(100+i/60,i>=2);
    if(phases.at(-1)!==state.phase)phases.push(state.phase);
    if(i/60<OPENING.end)assert.equal(state.complete,false);
  }
  assert.deepEqual(phases,['loading','authorization','welcome','archive']);
  assert.equal(clock.state.complete,true);
});
test('slow or failed resources hold the exact A endpoint without consuming B/C',()=>{
  const clock=new OpeningTimeline();clock.restart(0);
  run(clock,0,3,false);
  for(const time of [5,12,30,180]){
    const state=clock.advance(time,false);
    assert.equal(state.time,3);assert.equal(state.phase,'loading');assert.equal(state.held,true);
  }
  assert.equal(clock.advance(181,true).time,3);
  assert.equal(run(clock,181,181.2).phase,'authorization');
  const welcome=181+OPENING.authorizationEnd-OPENING.loadingEnd+.01;
  assert.equal(run(clock,181.2,welcome).phase,'welcome');
  assert.ok(Math.abs(run(clock,welcome,181+OPENING.end-3).time-OPENING.end)<1e-8);
});
test('ready exactly at the loading boundary does not insert a pause',()=>{
  const clock=new OpeningTimeline();clock.restart(0);
  assert.equal(run(clock,0,3).phase,'authorization');
  assert.equal(run(clock,3,3.2).held,false);
});
test('replay resets the same clock to A and keeps B/C duration',()=>{
  const clock=new OpeningTimeline();clock.restart(0);run(clock,0,OPENING.end);
  clock.restart(40);
  assert.equal(clock.state.time,0);assert.equal(clock.state.phase,'loading');
  assert.equal(run(clock,40,43).phase,'authorization');
  const end=40+OPENING.authorizationEnd;
  assert.equal(run(clock,43,end-.01).phase,'authorization');
  assert.equal(run(clock,end-.01,end+.01).phase,'welcome');
  assert.equal(run(clock,end+.01,40+OPENING.end).complete,true);
});
test('background suspension excludes hidden time',()=>{
  const clock=new OpeningTimeline();clock.restart(0);run(clock,0,1);
  clock.sync(120);
  assert.ok(Math.abs(clock.advance(120.1,true).time-1.1)<1e-9);
});
test('a main-thread stall cannot jump over the authorization beat',()=>{
  const clock=new OpeningTimeline();clock.restart(0);run(clock,0,2.99);
  const after=clock.advance(12,true);
  assert.equal(after.phase,'authorization');assert.ok(after.time<3.1);
  assert.equal(clock.advance(20,true).phase,'authorization');
});
test('reference camera and scan tracks are continuous across every phase boundary',()=>{
  for(const time of [OPENING.loadingEnd,OPENING.authorizationEnd,OPENING.entry]){
    assert.ok(Math.abs(openingAt(time-1e-7).referenceTime-openingAt(time+1e-7).referenceTime)<1e-5);
  }
  let previous=-Infinity;
  for(let i=0;i<=Math.floor(OPENING.end*100);i++){
    const value=openingAt(i/100).referenceTime;assert.ok(value>=previous);previous=value;
  }
  assert.equal(openingAt(OPENING.end).referenceTime,OPENING.archiveEnd);
});
test('welcome, the original low-lift hold, main rise and cover retain original speed',()=>{
  for(let time=OPENING.authorizationEnd;time<OPENING.end-.2;time+=.1){
    const difference=openingAt(time+.1).referenceTime-openingAt(time).referenceTime;
    assert.ok(Math.abs(difference-.1)<1e-10);
  }
  assert.ok(Math.abs(OPENING.end-18.04)<1e-10);
});

test('the distant raised-cover shot ends 650 ms after the cover wipe, not several seconds later',()=>{
  const coverEnd=PROJECT_COVER_OPENING_START+PROJECT_COVER_DURATION;
  assert.ok(Math.abs(OPENING.archiveEnd-coverEnd-.65)<1e-10);
  assert.equal(extraction(OPENING.archiveEnd),3.35);
  assert.ok(35-OPENING.archiveEnd>=4);
  assert.equal(openingAt(OPENING.end-.01).complete,false);
  assert.equal(openingAt(OPENING.end).complete,true);
});

test('authorization stays readable before its final reversed blink',async()=>{
  const {authorizationCue}=await import('../src/opening-cues.ts');
  assert.ok(OPENING.authorizationEnd-OPENING.loadingEnd>=1.8-1e-9);
  assert.equal(authorizationCue(OPENING.authorizationEnd-.6).inverted,false);
  assert.equal(authorizationCue(OPENING.authorizationEnd-.4).inverted,true);
  assert.equal(authorizationCue(OPENING.authorizationEnd-.02,true).opacity,1);
  assert.equal(authorizationCue(OPENING.authorizationEnd).inverted,false);
});
test('the callout line starts with the title, never during early archive entry',async()=>{
  const {archiveCalloutCue}=await import('../src/opening-cues.ts');
  for(const time of [21.9,22.08,23,25.67])assert.equal(archiveCalloutCue(time).visible,false);
  assert.deepEqual(archiveCalloutCue(25.68),{visible:true,progress:0});
  assert.ok(archiveCalloutCue(26.2).progress>0);
  assert.equal(archiveCalloutCue(28.3).visible,false);
});
