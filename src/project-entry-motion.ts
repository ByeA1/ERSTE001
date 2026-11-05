export const PROJECT_ENTRY = {approach:1.35,minimum:2.1,confirm:.45,fade:.45} as const;
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const PROJECT_RETURN_DURATION=1.55;
/** Reverse the existing camera/cover scan, after the page has begun receding. */
export function projectReturnAt(seconds:number){
  const time=Math.max(0,seconds);
  const reference=PROJECT_ENTRY.approach*(1-Math.max(0,Math.min(1,(time-.25)/1.15)));
  return {...projectEntryAt(reference),ui:smooth((time-1.05)/.5),complete:time>=PROJECT_RETURN_DURATION};
}
export function projectEntryAt(seconds:number) {
  const time=Math.max(0,seconds);
  const scanAge=time-PROJECT_ENTRY.approach;
  return {
    dolly:smooth(time/.55),
    align:smooth((time-.2)/.55),
    scan:smooth((time-.8)/.55),
    loaderOpacity:scanAge<0?0:scanAge>=.08 && scanAge<.15?.22:1,
    phase:time<.2?'dolly':time<.8?'align':time<PROJECT_ENTRY.approach?'scan':'loading',
  };
}
/** Keep a front-facing cassette inside the phone viewport below the case bar. */
export function projectEntryFraming(width:number,height:number) {
  const header=width<=640?60:64,margin=24;
  return {span:Math.max(4.1*height/Math.max(1,height-header-2*margin),5.6*height/Math.max(1,width-2*margin)),centerY:(height+header)/2/height};
}
