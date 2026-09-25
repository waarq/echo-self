import { accumulateSteps, FIXED_DT } from './Time';

export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number, fps: number) => void;

/**
 * requestAnimationFrame-driven loop that advances gameplay in fixed steps
 * (deterministic) while rendering at whatever rate the browser delivers
 * frames (PRD §33).
 */
export class GameLoop {
  private rafHandle: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private fpsAccumulatorTime = 0;
  private fpsFrameCount = 0;
  private fps = 0;

  private readonly update: UpdateFn;
  private readonly render: RenderFn;
  private readonly now: () => number;

  constructor(update: UpdateFn, render: RenderFn, now: () => number = () => performance.now()) {
    this.update = update;
    this.render = render;
    this.now = now;
  }

  get running(): boolean {
    return this.rafHandle !== null;
  }

  start(): void {
    if (this.running) return;
    this.lastTime = this.now();
    const tick = (): void => {
      const current = this.now();
      const frameTime = (current - this.lastTime) / 1000;
      this.lastTime = current;

      const result = accumulateSteps(frameTime, this.accumulator);
      this.accumulator = result.accumulator;
      for (let i = 0; i < result.steps; i++) {
        this.update(FIXED_DT);
      }

      this.trackFps(frameTime);
      const alpha = this.accumulator / FIXED_DT;
      this.render(alpha, this.fps);

      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private trackFps(frameTime: number): void {
    this.fpsAccumulatorTime += frameTime;
    this.fpsFrameCount += 1;
    if (this.fpsAccumulatorTime >= 0.5) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsAccumulatorTime);
      this.fpsAccumulatorTime = 0;
      this.fpsFrameCount = 0;
    }
  }
}
