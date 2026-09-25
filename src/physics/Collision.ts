import type { Body } from './Body';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Keeps a circle body inside axis-aligned bounds, zeroing the velocity
 * component that drove it into the wall so it doesn't feel sticky or
 * jittery on repeated collision (PRD §8: wall collision). */
export function resolveBoundsCollision(body: Body, bounds: Bounds): void {
  const { position, velocity, radius } = body;

  if (position.x - radius < bounds.minX) {
    position.x = bounds.minX + radius;
    if (velocity.x < 0) velocity.x = 0;
  } else if (position.x + radius > bounds.maxX) {
    position.x = bounds.maxX - radius;
    if (velocity.x > 0) velocity.x = 0;
  }

  if (position.y - radius < bounds.minY) {
    position.y = bounds.minY + radius;
    if (velocity.y < 0) velocity.y = 0;
  } else if (position.y + radius > bounds.maxY) {
    position.y = bounds.maxY - radius;
    if (velocity.y > 0) velocity.y = 0;
  }
}

export function circlesOverlap(a: Body, b: Body): boolean {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const rSum = a.radius + b.radius;
  return dx * dx + dy * dy < rSum * rSum;
}
