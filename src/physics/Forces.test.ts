import { describe, expect, it } from 'vitest';
import { moveToward } from './Forces';

describe('moveToward', () => {
  it('reaches the target exactly when maxDelta covers the distance', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 10, y: 0 }, 10);
    expect(result).toEqual({ x: 10, y: 0 });
  });

  it('never overshoots the target', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 10, y: 0 }, 1000);
    expect(result).toEqual({ x: 10, y: 0 });
  });

  it('moves partway when maxDelta is smaller than the distance', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 10, y: 0 }, 4);
    expect(result.x).toBeCloseTo(4);
    expect(result.y).toBeCloseTo(0);
  });

  it('handles diagonal movement proportionally', () => {
    const result = moveToward({ x: 0, y: 0 }, { x: 3, y: 4 }, 5);
    expect(result).toEqual({ x: 3, y: 4 });
  });
});
