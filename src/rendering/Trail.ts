import type { Vector2 } from '../core/Vector2';

export interface TrailPoint {
  position: Vector2;
  alpha: number;
}

/** Time-based afterimage trail (PRD §9's dash "motion trail", §21's
 * "directional trails"). Samples fade out over `lifetimeSec` after being
 * recorded rather than after N samples, so the trail shrinks smoothly once
 * the caller stops recording instead of holding stale points. */
export class MotionTrail {
  private samples: Array<{ position: Vector2; age: number }> = [];
  private readonly lifetimeSec: number;

  constructor(lifetimeSec = 0.25) {
    this.lifetimeSec = lifetimeSec;
  }

  record(position: Vector2): void {
    this.samples.push({ position: { ...position }, age: 0 });
  }

  update(dt: number): void {
    for (const sample of this.samples) sample.age += dt;
    this.samples = this.samples.filter((s) => s.age < this.lifetimeSec);
  }

  clear(): void {
    this.samples = [];
  }

  get points(): TrailPoint[] {
    return this.samples.map((s) => ({
      position: s.position,
      alpha: Math.max(0, 1 - s.age / this.lifetimeSec),
    }));
  }
}
