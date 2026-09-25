import { describe, expect, it } from 'vitest';
import { add, clampMagnitude, length, normalize, scale } from './Vector2';

describe('Vector2', () => {
  it('length()', () => {
    expect(length({ x: 3, y: 4 })).toBe(5);
  });

  it('normalize() returns a unit vector', () => {
    const n = normalize({ x: 3, y: 4 });
    expect(length(n)).toBeCloseTo(1);
  });

  it('normalize() of zero vector is zero, not NaN', () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('scale()', () => {
    expect(scale({ x: 2, y: -3 }, 2)).toEqual({ x: 4, y: -6 });
  });

  it('add()', () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  it('clampMagnitude() leaves short vectors untouched', () => {
    const v = { x: 1, y: 0 };
    expect(clampMagnitude(v, 5)).toEqual(v);
  });

  it('clampMagnitude() shrinks long vectors to the max length', () => {
    const v = { x: 10, y: 0 };
    const clamped = clampMagnitude(v, 5);
    expect(length(clamped)).toBeCloseTo(5);
  });
});
