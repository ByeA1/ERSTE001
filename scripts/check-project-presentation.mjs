import test from 'node:test';
import assert from 'node:assert/strict';
import {projectEntryAt,projectEntryFraming,PROJECT_ENTRY,projectReturnAt,PROJECT_RETURN_DURATION} from '../src/project-entry-motion.ts';
import {PROJECT_COVER_OPENING_START} from '../src/project-cover-motion.ts';
import {extraction} from '../src/motion.ts';
import {containHero,PROJECT_COVER} from '../src/project-cover.ts';
test('the cassette faces the viewer before the scan clears it',()=>{
  assert.equal(projectEntryAt(0).dolly,0);
  assert.equal(projectEntryAt(.55).dolly,1);
  assert.equal(projectEntryAt(.75).align,1);
  assert.equal(projectEntryAt(.75).scan,0);
  assert.equal(projectEntryAt(PROJECT_ENTRY.approach).scan,1);
  assert.ok(projectEntryAt(1).scan>0&&projectEntryAt(1).scan<1);
  assert.equal(projectEntryAt(PROJECT_ENTRY.approach-.001).loaderOpacity,0);
  assert.equal(projectEntryAt(PROJECT_ENTRY.approach+.2).loaderOpacity,1);
  assert.ok(Math.abs(PROJECT_ENTRY.minimum+PROJECT_ENTRY.confirm+PROJECT_ENTRY.fade-3)<1e-9);
});
test('portrait approach framing fits the complete cassette below the case bar',()=>{
  for(const [width,height] of [[320,740],[390,844],[402,730],[768,1024]]){
    const fit=projectEntryFraming(width,height),header=width<=640?60:64;
    assert.ok(5.6/fit.span*height<=width-48+1e-8);
    const cardHeight=4.1/fit.span*height,center=fit.centerY*height;
    assert.ok(center-cardHeight/2>=header+24-1e-8);
    assert.ok(center+cardHeight/2<=height-24+1e-8);
  }
});
test('opening cover waits until reference extraction has cleared the sea',()=>{
  assert.ok(PROJECT_COVER_OPENING_START>=28.85);
  assert.equal(extraction(PROJECT_COVER_OPENING_START),3.35);
});
test('portrait, landscape and square hero plates stay inside the fixed picture area',()=>{
  for(const [w,h] of [[1440,810],[1440,1080],[1000,1000],[1020,2944],[2944,1020]]){
    const fit=containHero(w,h),box=PROJECT_COVER.hero;
    assert.ok(fit.x>=box.x-1e-8&&fit.y>=box.y-1e-8);
    assert.ok(fit.x+fit.width<=box.x+box.width+1e-8);
    assert.ok(fit.y+fit.height<=box.y+box.height+1e-8);
    assert.ok(Math.abs(fit.width/fit.height-w/h)<1e-9);
    assert.ok(fit.y+fit.height<PROJECT_COVER.dividerY);
  }
});
test('return retraces the entry scan and camera, with UI after the cassette settles',()=>{
  let previous=projectReturnAt(0);
  assert.equal(previous.dolly,1);assert.equal(previous.align,1);assert.equal(previous.scan,1);assert.equal(previous.ui,0);
  for(let i=1;i<=155;i++){
    const time=i/100,cue=projectReturnAt(time);
    const reference=projectEntryAt(PROJECT_ENTRY.approach*(1-Math.max(0,Math.min(1,(time-.25)/1.15))));
    for(const key of ['dolly','align','scan']){assert.equal(cue[key],reference[key]);assert.ok(cue[key]<=previous[key]+1e-9);}
    assert.ok(cue.ui>=previous.ui);if(time<=1.05)assert.equal(cue.ui,0);
    previous=cue;
  }
  const end=projectReturnAt(PROJECT_RETURN_DURATION);
  assert.equal(end.scan,0);assert.equal(end.dolly,0);assert.equal(end.align,0);assert.equal(end.ui,1);assert.equal(end.complete,true);
});
