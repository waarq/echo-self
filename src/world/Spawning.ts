import type { Random } from '../core/Random';
import { Enemy } from '../entities/Enemy';
import type { Arena } from './Arena';

/** Picks a random one of the arena's pre-validated spawn points for a new
 * enemy — spawn points are generated alongside the arena's obstacles/hazards
 * (PRD §16), so this replaces Phase 1's naive random-edge-point placement,
 * which knew nothing about interior obstacles. */
export function spawnEnemyAtSpawnPoint(arena: Arena, rng: Random): Enemy {
  const point = arena.spawnPoints[rng.int(0, arena.spawnPoints.length - 1)];
  return new Enemy({ x: point.x, y: point.y });
}
