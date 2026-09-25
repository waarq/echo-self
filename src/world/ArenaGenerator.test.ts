import { describe, expect, it } from 'vitest';
import { Random } from '../core/Random';
import { generateArena } from './ArenaGenerator';
import { validateArena } from './ArenaValidation';

describe('generateArena', () => {
  it('always returns a valid arena across many seeds and complexity levels', () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const complexity of [0, 1, 2, 4, 6]) {
        const arena = generateArena(new Random(seed * 7919 + 1), complexity);
        expect(validateArena(arena)).toBe(true);
      }
    }
  });

  it('places more obstacles/hazards on average at higher complexity', () => {
    const pieceCount = (complexity: number): number => {
      let total = 0;
      for (let seed = 0; seed < 20; seed++) {
        const arena = generateArena(new Random(seed * 104729 + 3), complexity);
        total += arena.obstacles.length + arena.hazards.length;
      }
      return total;
    };

    expect(pieceCount(6)).toBeGreaterThan(pieceCount(0));
  });

  it('never places a piece overlapping the player spawn clearance at the center', () => {
    for (let seed = 0; seed < 20; seed++) {
      const arena = generateArena(new Random(seed * 13 + 5), 6);
      for (const rect of [...arena.obstacles, ...arena.hazards]) {
        const overlapsCenter =
          rect.minX < 160 && rect.maxX > -160 && rect.minY < 160 && rect.maxY > -160;
        expect(overlapsCenter).toBe(false);
      }
    }
  });
});
