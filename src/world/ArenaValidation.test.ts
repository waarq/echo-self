import { describe, expect, it } from 'vitest';
import type { Arena } from './Arena';
import { createDefaultArena } from './Arena';
import { validateArena } from './ArenaValidation';

describe('validateArena', () => {
  it('accepts the empty default arena', () => {
    expect(validateArena(createDefaultArena())).toBe(true);
  });

  it('rejects an arena with no spawn points', () => {
    const arena: Arena = { ...createDefaultArena(), spawnPoints: [] };
    expect(validateArena(arena)).toBe(false);
  });

  it('rejects an arena whose spawn point sits inside an obstacle', () => {
    const base = createDefaultArena();
    const spawnPoint = base.spawnPoints[0];
    const arena: Arena = {
      ...base,
      obstacles: [
        {
          minX: spawnPoint.x - 50,
          minY: spawnPoint.y - 50,
          maxX: spawnPoint.x + 50,
          maxY: spawnPoint.y + 50,
        },
      ],
    };
    expect(validateArena(arena)).toBe(false);
  });

  it('rejects an arena where a wall ring cuts a spawn point off from center', () => {
    const base = createDefaultArena();
    // Four thin walls forming a closed box far from center, isolating one
    // spawn point from the rest of the arena.
    const boxMinX = 300;
    const boxMinY = 300;
    const boxMaxX = 500;
    const boxMaxY = 500;
    const isolatedSpawn = { x: (boxMinX + boxMaxX) / 2, y: (boxMinY + boxMaxY) / 2 };
    const arena: Arena = {
      ...base,
      obstacles: [
        { minX: boxMinX, minY: boxMinY, maxX: boxMaxX, maxY: boxMinY + 20 }, // top
        { minX: boxMinX, minY: boxMaxY - 20, maxX: boxMaxX, maxY: boxMaxY }, // bottom
        { minX: boxMinX, minY: boxMinY, maxX: boxMinX + 20, maxY: boxMaxY }, // left
        { minX: boxMaxX - 20, minY: boxMinY, maxX: boxMaxX, maxY: boxMaxY }, // right
      ],
      spawnPoints: [isolatedSpawn],
    };
    expect(validateArena(arena)).toBe(false);
  });

  it('rejects an arena where the only route to a spawn point crosses a hazard', () => {
    const base = createDefaultArena();
    const spawnPoint = base.spawnPoints[0];
    // A hazard strip spanning the full width just above the spawn point,
    // between it and the center — the only way through is to take damage.
    const arena: Arena = {
      ...base,
      hazards: [
        {
          minX: base.bounds.minX,
          minY: spawnPoint.y - 30,
          maxX: base.bounds.maxX,
          maxY: spawnPoint.y + 30,
          damagePerHit: 1,
        },
      ],
      spawnPoints: [spawnPoint],
    };
    expect(validateArena(arena)).toBe(false);
  });

  it('accepts an arena with a small obstacle that leaves plenty of open space', () => {
    const base = createDefaultArena();
    const arena: Arena = {
      ...base,
      obstacles: [{ minX: 300, minY: -20, maxX: 340, maxY: 20 }],
    };
    expect(validateArena(arena)).toBe(true);
  });

  it('rejects an arena where most of the open area is walled off into unreachable pockets', () => {
    const base = createDefaultArena();
    const bounds = base.bounds;
    // Two full-height walls leave only a narrow reachable strip around the
    // center; the much larger left/right pockets beyond them are open
    // (unblocked) but unreachable, so the open-area ratio should fail even
    // though every spawn point in the center strip is itself reachable.
    const arena: Arena = {
      ...base,
      obstacles: [
        { minX: -260, minY: bounds.minY, maxX: -220, maxY: bounds.maxY },
        { minX: 220, minY: bounds.minY, maxX: 260, maxY: bounds.maxY },
      ],
      spawnPoints: [
        { x: 0, y: 400 },
        { x: 0, y: -400 },
      ],
    };
    expect(validateArena(arena)).toBe(false);
  });
});
