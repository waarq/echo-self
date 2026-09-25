/** Brief freeze-frame on impactful hits (PRD §10, §21: "impact frame",
 * "tiny time slowdown" — the dopamine-spike beat, not a real slow-motion
 * effect). Simulation stays deterministic: this doesn't scale dt, it tells
 * the caller to skip whole fixed-timestep ticks, so replays are unaffected —
 * only real-world pacing pauses. */
export class HitStopController {
  private timer = 0;

  get active(): boolean {
    return this.timer > 0;
  }

  /** Requests a freeze of at least `durationSec`. Overlapping requests take
   * the longer one rather than stacking additively — a flurry of hits in one
   * frame should still feel like a single beat, not a game-breaking pause
   * (same "never make it unwinnable" discipline as DifficultyDirector). */
  trigger(durationSec: number): void {
    this.timer = Math.max(this.timer, durationSec);
  }

  /** Advances the freeze timer by one real frame's time and reports whether
   * this tick should be skipped. */
  tick(dt: number): boolean {
    if (this.timer <= 0) return false;
    this.timer = Math.max(0, this.timer - dt);
    return true;
  }
}
