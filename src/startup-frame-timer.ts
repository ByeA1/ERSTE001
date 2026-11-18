/** Startup-only GPU timing. Never attached to the live rendering loop. */
export type StartupFrameCost = {frameMs:number;cpuMs:number;gpuMs?:number;method:'timer-query'|'gpu-completion'};
export class StartupFrameTimer {
  private extension: {TIME_ELAPSED_EXT:number;GPU_DISJOINT_EXT:number}|null;
  constructor(private gl:WebGL2RenderingContext) {
    this.extension=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  }
  async measure(draw:()=>boolean, deadline:number):Promise<StartupFrameCost|undefined> {
    const gl=this.gl,ext=this.extension;
    if(gl.isContextLost()||performance.now()>=deadline)return;
    const query=ext?gl.createQuery():null;
    let open=false;
    try {
      if(query&&ext){gl.beginQuery(ext.TIME_ELAPSED_EXT,query);open=true;}
      const start=performance.now(),drew=draw(),cpuMs=performance.now()-start;
      if(open&&ext){gl.endQuery(ext.TIME_ELAPSED_EXT);open=false;}
      if(!drew)return;
      if(!query||!ext){
        gl.finish();
        return {cpuMs,frameMs:performance.now()-start,method:'gpu-completion'};
      }
      gl.flush();
      // Results become available only after yielding to the browser. Polling
      // time is deliberately excluded from measured rendering cost.
      const until=Math.min(deadline,performance.now()+220);
      do {
        await new Promise<void>(resolve=>setTimeout(resolve,0));
        if(gl.isContextLost()||gl.getParameter(ext.GPU_DISJOINT_EXT))return;
        if(gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)){
          const gpuMs=Number(gl.getQueryParameter(query,gl.QUERY_RESULT))/1e6;
          if(Number.isFinite(gpuMs)&&gpuMs>0)return {cpuMs,gpuMs,frameMs:cpuMs+gpuMs,method:'timer-query'};
          return;
        }
      } while(performance.now()<until&&!document.hidden);
    } finally {
      if(open&&ext)gl.endQuery(ext.TIME_ELAPSED_EXT);
      if(query)gl.deleteQuery(query);
    }
  }
}
