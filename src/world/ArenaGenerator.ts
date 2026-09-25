import type { Random } from '../core/Random';
import type { Arena, HazardZone, Rect } from './Arena';
import { ARENA_HALF_HEIGHT, ARENA_HALF_WIDTH, createDefaultArena, edgeSpawnPoints } from './Arena';
import { validateArena } from './ArenaValidation';

/** Reusable rectangular wall sizes ("modular pieces", PRD §16) that
 * generation instances at random positions rather than sizing walls
 * arbitrarily — keeps generated arenas visually/structurally consistent. */
const OBSTACLE_PIECE_SIZES: Array<{ width: number; height: number }> = [
  { width: 220, height: 40 }, // long wall
  { width: 40, height: 220 }, // long wall, vertical
  { width: 120, height: 120 }, // block
  { width: 160, height: 60 }, // platform
];

const HAZARD_PIECE_SIZES: Array<{ width: number; height: number }> = [
  { width: 100, height: 100 },
  { width: 160, height: 80 },
];

/** Nothing may be placed within this radius of the arena center — that's
 * the player's spawn, and it must always start clear (PRD §16: "never
 * generate impossible spawn positions"). */
const CENTER_CLEARANCE = 160;

const MAX_OBSTACLES_PER_COMPLEXITY = 2;
const MAX_HAZARDS_PER_COMPLEXITY = 1;
const MAX_OBSTACLES = 10;
const MAX_HAZARDS = 5;

const MAX_GENERATION_ATTEMPTS = 40;

function overlapsRect(a: Rect, b: Rect, margin = 0): boolean {
  return (
    a.minX - margin < b.maxX &&
    a.maxX + margin > b.minX &&
    a.minY - margin < b.maxY &&
    a.maxY + margin > b.minY
  );
}

function withinCenterClearance(rect: Rect): boolean {
  return overlapsRect(rect, {
    minX: -CENTER_CLEARANCE,
    minY: -CENTER_CLEARANCE,
    maxX: CENTER_CLEARANCE,
    maxY: CENTER_CLEARANCE,
  });
}

function placePiece(rng: Random, size: { width: number; height: number }, margin: number): Rect {
  const x = rng.range(
    -ARENA_HALF_WIDTH + margin + size.width / 2,
    ARENA_HALF_WIDTH - margin - size.width / 2,
  );
  const y = rng.range(
    -ARENA_HALF_HEIGHT + margin + size.height / 2,
    ARENA_HALF_HEIGHT - margin - size.height / 2,
  );
  return {
    minX: x - size.width / 2,
    minY: y - size.height / 2,
    maxX: x + size.width / 2,
    maxY: y + size.height / 2,
  };
}

function buildCandidate(rng: Random, complexity: number): Arena {
  const bounds = createDefaultArena().bounds;

  const obstacleCount = Math.min(
    MAX_OBSTACLES,
    Math.round(complexity * MAX_OBSTACLES_PER_COMPLEXITY),
  );
  const hazardCount = Math.min(MAX_HAZARDS, Math.round(complexity * MAX_HAZARDS_PER_COMPLEXITY));

  const obstacles: Rect[] = [];
  for (let i = 0; i < obstacleCount; i++) {
    const size = OBSTACLE_PIECE_SIZES[rng.int(0, OBSTACLE_PIECE_SIZES.length - 1)];
    const rect = placePiece(rng, size, 60);
    if (withinCenterClearance(rect)) continue;
    if (obstacles.some((existing) => overlapsRect(existing, rect, 20))) continue;
    obstacles.push(rect);
  }

  const hazards: HazardZone[] = [];
  for (let i = 0; i < hazardCount; i++) {
    const size = HAZARD_PIECE_SIZES[rng.int(0, HAZARD_PIECE_SIZES.length - 1)];
    const rect = placePiece(rng, size, 60);
    if (withinCenterClearance(rect)) continue;
    if (obstacles.some((existing) => overlapsRect(existing, rect, 20))) continue;
    if (hazards.some((existing) => overlapsRect(existing, rect, 20))) continue;
    hazards.push({ ...rect, damagePerHit: 1 });
  }

  return {
    bounds,
    obstacles,
    hazards,
    spawnPoints: edgeSpawnPoints(bounds),
  };
}

/**
 * Generates a procedural arena from modular obstacle/hazard pieces (PRD
 * §16). `complexity` (>= 0) scales how many pieces get placed — the hook
 * Phase 7's DifficultyDirector will drive; for now callers pass a fixed
 * starting value. Every candidate is run through {@link validateArena}
 * before being accepted, and generation falls back to the guaranteed-valid
 * default arena if it can't find a valid layout within its attempt budget,
 * so an invalid arena can never reach the game (PRD §16: "reject invalid
 * arenas").
 */
export function generateArena(rng: Random, complexity: number): Arena {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = buildCandidate(rng, complexity);
    if (validateArena(candidate)) return candidate;
  }
  return createDefaultArena();
}
