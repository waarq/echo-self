import type { Vector2 } from '../core/Vector2';
import { clampMagnitude, length, scale } from '../core/Vector2';
import { Body } from '../physics/Body';
import { moveToward } from '../physics/Forces';

export const PLAYER_RADIUS = 18;
export const PLAYER_MAX_SPEED = 420; // px/s
export const PLAYER_ACCEL = 2800; // px/s^2 — reaches max speed in ~0.15s
export const PLAYER_FRICTION = 3400; // px/s^2 — stops slightly faster than it starts

/** The player character: a physics body driven by a normalized move axis.
 * Deliberately has no dash/attack yet — those land in Phase 2. Keeping this
 * minimal is what let Phase 1 focus entirely on "does moving feel good." */
export class Player {
  readonly body: Body;
  facing = 0; // radians, retained across frames of no input

  constructor(position: Vector2) {
    this.body = new Body(position, PLAYER_RADIUS);
  }

  update(dt: number, moveAxis: Vector2): void {
    const input = clampMagnitude(moveAxis, 1);
    const targetVelocity = scale(input, PLAYER_MAX_SPEED);
    const rate = length(input) > 0 ? PLAYER_ACCEL : PLAYER_FRICTION;
    this.body.velocity = moveToward(this.body.velocity, targetVelocity, rate * dt);
    this.body.integrate(dt);

    if (length(input) > 0.001) {
      this.facing = Math.atan2(input.y, input.x);
    }
  }
}
