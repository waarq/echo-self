import type { Vector2 } from '../core/Vector2';

/** Moves `current` toward `target` by at most `maxDelta`, component-wise on
 * the vector's magnitude. Used to accelerate toward a desired velocity and
 * decelerate (friction) toward zero without ever overshooting — this is what
 * keeps movement feeling snappy instead of floaty (PRD §8). */
export function moveToward(current: Vector2, target: Vector2, maxDelta: number): Vector2 {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= maxDelta || dist === 0) {
    return { ...target };
  }
  const t = maxDelta / dist;
  return { x: current.x + dx * t, y: current.y + dy * t };
}
