import type { Arena, Rect } from './Arena';
import type { Vector2 } from '../core/Vector2';

/** Grid cell size used to rasterize the arena for reachability checks.
 * Small enough to catch narrow passages, large enough that a 1800x1100
 * arena stays cheap (~45x28 cells). */
const CELL_SIZE = 40;

/** Half the player's collider plus a small buffer, inflated onto every
 * obstacle so a cell only counts as open if the player could actually fit
 * through it, not just its center point. Kept as a local constant (rather
 * than importing from entities/Player) to avoid a world→entities
 * dependency for one number. */
const PLAYER_CLEARANCE = 26;

/** Minimum fraction of all in-bounds, non-obstacle cells that must be
 * reachable from the center via a hazard-free path. Guards against
 * "technically playable but 90% of the arena is walled off" layouts. */
const MIN_OPEN_RATIO = 0.5;

interface Grid {
  cols: number;
  rows: number;
  minX: number;
  minY: number;
  /** true where an obstacle (inflated by clearance) occupies the cell. */
  blocked: boolean[];
  /** true where a hazard occupies the cell (never also `blocked`). */
  hazardous: boolean[];
}

function toCell(grid: Grid, point: Vector2): { gx: number; gy: number } {
  return {
    gx: Math.floor((point.x - grid.minX) / CELL_SIZE),
    gy: Math.floor((point.y - grid.minY) / CELL_SIZE),
  };
}

function inGrid(grid: Grid, gx: number, gy: number): boolean {
  return gx >= 0 && gy >= 0 && gx < grid.cols && gy < grid.rows;
}

function cellIndex(grid: Grid, gx: number, gy: number): number {
  return gy * grid.cols + gx;
}

function rectOverlapsCell(grid: Grid, rect: Rect, gx: number, gy: number, inflate = 0): boolean {
  const cellMinX = grid.minX + gx * CELL_SIZE;
  const cellMinY = grid.minY + gy * CELL_SIZE;
  const cellMaxX = cellMinX + CELL_SIZE;
  const cellMaxY = cellMinY + CELL_SIZE;
  return (
    rect.minX - inflate < cellMaxX &&
    rect.maxX + inflate > cellMinX &&
    rect.minY - inflate < cellMaxY &&
    rect.maxY + inflate > cellMinY
  );
}

function buildGrid(arena: Arena): Grid {
  const { bounds } = arena;
  const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / CELL_SIZE));
  const rows = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / CELL_SIZE));
  const grid: Grid = {
    cols,
    rows,
    minX: bounds.minX,
    minY: bounds.minY,
    blocked: new Array(cols * rows).fill(false),
    hazardous: new Array(cols * rows).fill(false),
  };

  for (const obstacle of arena.obstacles) {
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (rectOverlapsCell(grid, obstacle, gx, gy, PLAYER_CLEARANCE)) {
          grid.blocked[cellIndex(grid, gx, gy)] = true;
        }
      }
    }
  }

  for (const hazard of arena.hazards) {
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        if (rectOverlapsCell(grid, hazard, gx, gy)) {
          grid.hazardous[cellIndex(grid, gx, gy)] = true;
        }
      }
    }
  }

  return grid;
}

/** Flood-fills from `start`, treating obstacle cells as always blocking and
 * hazard cells as blocking only when `avoidHazards` is true. Returns the set
 * of reached cell indices. */
function floodFill(grid: Grid, start: Vector2, avoidHazards: boolean): Set<number> {
  const reached = new Set<number>();
  const { gx: startGx, gy: startGy } = toCell(grid, start);
  if (!inGrid(grid, startGx, startGy)) return reached;
  if (grid.blocked[cellIndex(grid, startGx, startGy)]) return reached;
  if (avoidHazards && grid.hazardous[cellIndex(grid, startGx, startGy)]) return reached;

  const queue: Array<[number, number]> = [[startGx, startGy]];
  reached.add(cellIndex(grid, startGx, startGy));

  while (queue.length > 0) {
    const [gx, gy] = queue.pop()!;
    const neighbors: Array<[number, number]> = [
      [gx + 1, gy],
      [gx - 1, gy],
      [gx, gy + 1],
      [gx, gy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (!inGrid(grid, nx, ny)) continue;
      const idx = cellIndex(grid, nx, ny);
      if (reached.has(idx)) continue;
      if (grid.blocked[idx]) continue;
      if (avoidHazards && grid.hazardous[idx]) continue;
      reached.add(idx);
      queue.push([nx, ny]);
    }
  }

  return reached;
}

function withinBounds(point: Vector2, grid: Grid): boolean {
  const { gx, gy } = toCell(grid, point);
  return inGrid(grid, gx, gy);
}

/**
 * Rejects arenas that violate PRD §16's "never generate" list:
 * - the player's own spawn (arena center) sits inside an obstacle
 * - any enemy spawn point is unreachable, out of bounds, or inside an obstacle
 * - the only route to a spawn point requires standing in a hazard
 *   (i.e. "unavoidable damage")
 * - obstacles wall off so much of the arena that it feels like a maze
 *   rather than an arena
 */
export function validateArena(arena: Arena): boolean {
  const grid = buildGrid(arena);
  const center: Vector2 = { x: 0, y: 0 };

  if (!withinBounds(center, grid)) return false;
  const { gx: centerGx, gy: centerGy } = toCell(grid, center);
  if (grid.blocked[cellIndex(grid, centerGx, centerGy)]) return false;

  const reachableAny = floodFill(grid, center, false);
  const reachableSafe = floodFill(grid, center, true);

  if (arena.spawnPoints.length === 0) return false;

  for (const spawnPoint of arena.spawnPoints) {
    if (!withinBounds(spawnPoint, grid)) return false;
    const { gx, gy } = toCell(grid, spawnPoint);
    const idx = cellIndex(grid, gx, gy);
    if (grid.blocked[idx]) return false;
    if (!reachableAny.has(idx)) return false;
    if (!reachableSafe.has(idx)) return false;
  }

  let openCells = 0;
  for (let i = 0; i < grid.blocked.length; i++) {
    if (!grid.blocked[i]) openCells++;
  }
  if (openCells === 0 || reachableSafe.size / openCells < MIN_OPEN_RATIO) return false;

  return true;
}
