import type { Body } from '../physics/Body';
import { circleOverlapsRect, resolveObstaclesCollision } from '../physics/Collision';
import type { Arena, HazardZone } from '../world/Arena';

export interface Damageable {
  body: Body;
  takeDamage(amount: number): void;
}

/** Keeps a body out of every obstacle in the arena — call once per entity
 * per tick, after movement integration, alongside resolveBoundsCollision. */
export function resolveArenaObstacles(body: Body, arena: Arena): void {
  resolveObstaclesCollision(body, arena.obstacles);
}

/** Applies hazard damage to anything standing in a hazard zone. Entities
 * with an invulnerability window (Player, and Echo's wrapped Player) only
 * take this once per window, same as any other damage source; entities
 * without one (Enemy) take it every tick they remain inside — hazards are
 * meant to be a real deterrent, not a background tick. */
export function applyHazardDamage(entity: Damageable, hazards: readonly HazardZone[]): void {
  for (const hazard of hazards) {
    if (circleOverlapsRect(entity.body, hazard)) {
      entity.takeDamage(hazard.damagePerHit);
    }
  }
}
