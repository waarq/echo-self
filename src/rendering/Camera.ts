import type { Vector2 } from '../core/Vector2';

const FOLLOW_SPEED = 8; // higher = snappier follow

/** Smoothly follows a world-space target. Exponential smoothing (rather than
 * a fixed lerp factor) so follow speed is frame-rate independent (PRD §22). */
export class Camera {
  position: Vector2 = { x: 0, y: 0 };
  private shakeTime = 0;
  private shakeMagnitude = 0;

  follow(target: Vector2, dt: number): void {
    const t = 1 - Math.exp(-FOLLOW_SPEED * dt);
    this.position.x += (target.x - this.position.x) * t;
    this.position.y += (target.y - this.position.y) * t;
  }

  shake(magnitude: number, durationSec: number): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
    this.shakeTime = Math.max(this.shakeTime, durationSec);
  }

  /** Returns the render offset for this frame (world -> screen translation
   * plus any active shake) and advances/decays the shake timer. */
  getOffset(viewportWidth: number, viewportHeight: number, dt: number): Vector2 {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() * 2 - 1) * this.shakeMagnitude;
      shakeY = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      this.shakeMagnitude *= 0.9;
    }
    return {
      x: viewportWidth / 2 - this.position.x + shakeX,
      y: viewportHeight / 2 - this.position.y + shakeY,
    };
  }
}
