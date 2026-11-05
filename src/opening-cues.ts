import {OPENING} from './opening-timeline.ts';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function authorizationCue(time:number,reduced=false) {
  const active=time>=OPENING.loadingEnd && time<OPENING.authorizationEnd;
  const exit=(time-(OPENING.authorizationEnd-.48))/.48;
  const inverted=active && exit>=0;
  const opacity=!active || !inverted || reduced ? 1 : exit<.28 ? 1 : exit<.4 ? .18 : exit<.7 ? 1 : exit<.8 ? .15 : clamp((1-exit)/.2);
  return {inverted,opacity};
}
export function archiveCalloutCue(referenceTime:number) {
  const x=clamp((referenceTime-25.68)/.9);
  return {visible:referenceTime>=25.68 && referenceTime<28.3,progress:x*x*(3-2*x)};
}
