import type { Bounds, Rect } from '../physics/Collision';
import type { Vector2 } from '../core/Vector2';

export type { Rect };

/** A rectangular zone that damages anything standing in it. Distinct from an
 * Obstacle in that it never blocks movement — only walls do that. */
export interface HazardZone extends Rect {
  damagePerHit: number;
}

/** A fully-described playable space: outer bounds plus the modular pieces
 * (PRD §16) scattered inside it. `spawnPoints` are pre-computed valid enemy
 * spawn locations rather than something callers derive from bounds, so a
 * generated arena's spawn points can route around its own obstacles. */
export interface Arena {
  bounds: Bounds;
  obstacles: Rect[];
  hazards: HazardZone[];
  spawnPoints: Vector2[];
}

export const ARENA_HALF_WIDTH = 900;
export const ARENA_HALF_HEIGHT = 550;

/** The simplest possible playable arena: outer bounds, no obstacles or
 * hazards, spawn points ringing the edge. Used as the Phase 1 prototype
 * space and as ArenaGenerator's guaranteed-valid fallback if procedural
 * generation can't find a valid layout within its attempt budget. */
export function createDefaultArena(): Arena {
  const bounds: Bounds = {
    minX: -ARENA_HALF_WIDTH,
    minY: -ARENA_HALF_HEIGHT,
    maxX: ARENA_HALF_WIDTH,
    maxY: ARENA_HALF_HEIGHT,
  };
  return {
    bounds,
    obstacles: [],
    hazards: [],
    spawnPoints: edgeSpawnPoints(bounds),
  };
}

/** Evenly-spaced spawn points around the inside edge of `bounds`, used both
 * by the default arena and as a starting point ArenaGenerator perturbs. */
export function edgeSpawnPoints(bounds: Bounds, count = 8, margin = 60): Vector2[] {
  const points: Vector2[] = [];
  const perimeterSegments = 4;
  const perSegment = Math.max(1, Math.floor(count / perimeterSegments));
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  for (let i = 0; i < perSegment; i++) {
    const t = (i + 1) / (perSegment + 1);
    points.push({ x: bounds.minX + t * width, y: bounds.minY + margin }); // top
    points.push({ x: bounds.minX + t * width, y: bounds.maxY - margin }); // bottom
    points.push({ x: bounds.minX + margin, y: bounds.minY + t * height }); // left
    points.push({ x: bounds.maxX - margin, y: bounds.minY + t * height }); // right
  }
  return points;
}
