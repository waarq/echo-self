import type { Body } from './Body';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Axis-aligned rectangle — same shape as Bounds, named separately because
 * it's used for interior arena pieces (obstacles, hazards) rather than the
 * arena's outer edge. */
export type Rect = Bounds;

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

export function circleOverlapsRect(body: Body, rect: Rect): boolean {
  const { position, radius } = body;
  const closestX = Math.max(rect.minX, Math.min(position.x, rect.maxX));
  const closestY = Math.max(rect.minY, Math.min(position.y, rect.maxY));
  const dx = position.x - closestX;
  const dy = position.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

/** Pushes a circle body back out of a rectangle obstacle along whichever
 * axis has the least penetration, and zeros the velocity component that
 * drove it in — the same treatment resolveBoundsCollision gives the arena's
 * outer walls, applied to interior obstacles (PRD §16 arena pieces). */
export function resolveObstacleCollision(body: Body, rect: Rect): void {
  if (!circleOverlapsRect(body, rect)) return;

  const { position, velocity, radius } = body;
  const overlapLeft = position.x + radius - rect.minX;
  const overlapRight = rect.maxX - (position.x - radius);
  const overlapTop = position.y + radius - rect.minY;
  const overlapBottom = rect.maxY - (position.y - radius);

  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  if (minOverlap === overlapLeft) {
    position.x = rect.minX - radius;
    if (velocity.x > 0) velocity.x = 0;
  } else if (minOverlap === overlapRight) {
    position.x = rect.maxX + radius;
    if (velocity.x < 0) velocity.x = 0;
  } else if (minOverlap === overlapTop) {
    position.y = rect.minY - radius;
    if (velocity.y > 0) velocity.y = 0;
  } else {
    position.y = rect.maxY + radius;
    if (velocity.y < 0) velocity.y = 0;
  }
}

export function resolveObstaclesCollision(body: Body, obstacles: readonly Rect[]): void {
  for (const obstacle of obstacles) resolveObstacleCollision(body, obstacle);
}
