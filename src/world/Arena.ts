import type { Bounds } from '../physics/Collision';

/** Single static rectangular arena for the Phase 1 movement prototype.
 * Procedural, modular arenas arrive in Phase 6 — this is intentionally the
 * simplest possible playable space. */
export function createDefaultArena(): Bounds {
  const halfWidth = 900;
  const halfHeight = 550;
  return { minX: -halfWidth, minY: -halfHeight, maxX: halfWidth, maxY: halfHeight };
}
