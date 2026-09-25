import { describe, expect, it } from 'vitest';
import { Random } from './Random';

describe('Random', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Random(1234);
    const b = new Random(1234);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Random(1);
    const b = new Random(2);
    expect(a.next()).not.toBeCloseTo(b.next(), 6);
  });

  it('range() stays within [min, max)', () => {
    const r = new Random(42);
    for (let i = 0; i < 1000; i++) {
      const v = r.range(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it('int() stays within [min, max] inclusive', () => {
    const r = new Random(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const v = r.int(0, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([0, 1, 2, 3]));
  });
});
