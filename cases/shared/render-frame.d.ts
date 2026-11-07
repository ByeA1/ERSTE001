export const WEB_RENDER_FPS: 60;
export class RenderFrameLimiter {
  readonly fpsLimit: 60 | 120;
  admit(now: number, allowHighRefresh?: boolean): boolean;
  recordFrame(cpuMs: number): void;
  reset(): void;
}
