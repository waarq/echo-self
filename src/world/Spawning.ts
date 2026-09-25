import type { Bounds } from '../physics/Collision';
import type { Random } from '../core/Random';
import { Enemy } from '../entities/Enemy';

/** Picks a random point on the arena's edge to spawn an enemy — simple stand-
 * in for Phase 6/7's real spawn-point + difficulty-aware placement. */
export function spawnEnemyAtEdge(bounds: Bounds, rng: Random): Enemy {
  const side = rng.int(0, 3);
  const margin = 40;
  let x: number;
  let y: number;
  switch (side) {
    case 0: // top
      x = rng.range(bounds.minX + margin, bounds.maxX - margin);
      y = bounds.minY + margin;
      break;
    case 1: // right
      x = bounds.maxX - margin;
      y = rng.range(bounds.minY + margin, bounds.maxY - margin);
      break;
    case 2: // bottom
      x = rng.range(bounds.minX + margin, bounds.maxX - margin);
      y = bounds.maxY - margin;
      break;
    default: // left
      x = bounds.minX + margin;
      y = rng.range(bounds.minY + margin, bounds.maxY - margin);
  }
  return new Enemy({ x, y });
}
