import { ECHO_RECORDING_DURATION_SEC } from './EchoSystem';

export type DifficultyTier =
  | 'INTRO'
  | 'FIRST_ECHO'
  | 'MULTIPLE_THREATS'
  | 'HAZARDS'
  | 'MULTIPLE_ECHOES'
  | 'ECHO_INTERACTIONS'
  | 'HIGH_DENSITY';

/** Time bands from PRD §15's difficulty curve. Sorted ascending; the tier in
 * effect is the last one whose startSec has been reached. */
const TIER_BOUNDARIES: ReadonlyArray<{ tier: DifficultyTier; startSec: number }> = [
  { tier: 'INTRO', startSec: 0 },
  { tier: 'FIRST_ECHO', startSec: 30 },
  { tier: 'MULTIPLE_THREATS', startSec: 60 },
  { tier: 'HAZARDS', startSec: 120 },
  { tier: 'MULTIPLE_ECHOES', startSec: 180 },
  { tier: 'ECHO_INTERACTIONS', startSec: 300 },
  { tier: 'HIGH_DENSITY', startSec: 600 },
];

export function tierForElapsed(elapsedSec: number): DifficultyTier {
  let tier = TIER_BOUNDARIES[0].tier;
  for (const boundary of TIER_BOUNDARIES) {
    if (elapsedSec >= boundary.startSec) tier = boundary.tier;
  }
  return tier;
}

const MIN_ENEMIES = 1;
// Hard ceiling on concurrent enemies — PRD §14: scale via decision density,
// not raw numerical growth, and Phase 7 must never make the run literally
// unwinnable.
const MAX_ENEMIES = 5;
const ENEMY_RAMP_SEC = 90;

export function maxEnemiesForElapsed(elapsedSec: number): number {
  if (elapsedSec < TIER_BOUNDARIES[1].startSec) return MIN_ENEMIES;
  const ramped =
    MIN_ENEMIES + Math.floor((elapsedSec - TIER_BOUNDARIES[1].startSec) / ENEMY_RAMP_SEC);
  return Math.min(MAX_ENEMIES, ramped);
}

const MAX_ENEMY_RESPAWN_DELAY_SEC = 1.2;
const MIN_ENEMY_RESPAWN_DELAY_SEC = 0.5;
const RESPAWN_RAMP_SEC = 240;

/** Enemy spawn frequency (PRD §14/Phase 7): respawn delay tightens over the
 * run but never drops below a floor, so the player is never facing an
 * unbroken stream of enemies. */
export function enemyRespawnDelayForElapsed(elapsedSec: number): number {
  const t = Math.min(1, elapsedSec / RESPAWN_RAMP_SEC);
  return (
    MAX_ENEMY_RESPAWN_DELAY_SEC - t * (MAX_ENEMY_RESPAWN_DELAY_SEC - MIN_ENEMY_RESPAWN_DELAY_SEC)
  );
}

const MIN_ARENA_COMPLEXITY = 2;
// ArenaGenerator itself hard-caps obstacle/hazard counts (MAX_OBSTACLES,
// MAX_HAZARDS), so complexity beyond this has no further effect — the
// director doesn't need its own separate ceiling to stay safe.
const MAX_ARENA_COMPLEXITY = 6;
const ARENA_COMPLEXITY_RAMP_SEC = 180;

/** Arena complexity and, transitively, hazard frequency (ArenaGenerator
 * scales hazard count off this same value) — PRD §15's "2-3 minutes:
 * environmental hazards" band. Only used to pick the complexity for arena
 * generation today; regenerating the arena live mid-run is Phase 8's
 * ESCALATION state, not this one. */
export function arenaComplexityForElapsed(elapsedSec: number): number {
  const t = Math.min(1, elapsedSec / ARENA_COMPLEXITY_RAMP_SEC);
  return MIN_ARENA_COMPLEXITY + t * (MAX_ARENA_COMPLEXITY - MIN_ARENA_COMPLEXITY);
}

// Hard ceiling on simultaneously active Echoes. Echoes accumulate forever
// over an endless run; without a cap the field would eventually hold more
// threats than any player could survive, which is exactly what Phase 7 must
// prevent (PRD: "must never directly make the game impossible"). Oldest
// Echoes retire first so the fight always stays bounded.
const MAX_ACTIVE_ECHOES = 4;
const ECHO_CAP_RAMP_SEC = 60;

export function maxActiveEchoesForElapsed(elapsedSec: number): number {
  if (elapsedSec < ECHO_RECORDING_DURATION_SEC) return 0;
  const ramped = 1 + Math.floor((elapsedSec - ECHO_RECORDING_DURATION_SEC) / ECHO_CAP_RAMP_SEC);
  return Math.min(MAX_ACTIVE_ECHOES, ramped);
}

/**
 * Central difficulty authority (PRD Phase 7). Tracks elapsed run time and
 * exposes the knobs every other system reads to scale up over an endless
 * run: enemy frequency, enemy count, arena complexity (and via it, hazard
 * frequency), and how many Echoes may be active at once. Enemy *types* and
 * projectile density are listed in the PRD but have nothing to scale yet —
 * only the Chaser exists and there is no Projectile entity — so those knobs
 * are deferred the same way Echo-vs-projectile interactions already are
 * (see CLAUDE.md).
 *
 * Every knob here is derived from a pure, independently testable function
 * and is clamped to a ceiling, so no amount of elapsed time can push the
 * game into an unwinnable state.
 */
export class DifficultyDirector {
  private elapsedSec = 0;

  update(dt: number): void {
    this.elapsedSec += dt;
  }

  get elapsedSeconds(): number {
    return this.elapsedSec;
  }

  get tier(): DifficultyTier {
    return tierForElapsed(this.elapsedSec);
  }

  get maxEnemies(): number {
    return maxEnemiesForElapsed(this.elapsedSec);
  }

  get enemyRespawnDelay(): number {
    return enemyRespawnDelayForElapsed(this.elapsedSec);
  }

  get arenaComplexity(): number {
    return arenaComplexityForElapsed(this.elapsedSec);
  }

  get maxActiveEchoes(): number {
    return maxActiveEchoesForElapsed(this.elapsedSec);
  }
}
