import { describe, expect, it } from 'vitest';
import { opacityForEchoIndex } from './EchoRenderer';

describe('opacityForEchoIndex', () => {
  it('matches the PRD §18 example table for the first three Echoes', () => {
    expect(opacityForEchoIndex(0)).toBe(0.8);
    expect(opacityForEchoIndex(1)).toBe(0.65);
    expect(opacityForEchoIndex(2)).toBe(0.5);
  });

  it('floors further Echoes rather than fading them past readability', () => {
    expect(opacityForEchoIndex(3)).toBe(0.4);
    expect(opacityForEchoIndex(10)).toBe(0.4);
  });

  it('always stays below full opacity so the live player remains dominant', () => {
    for (let i = 0; i < 6; i++) {
      expect(opacityForEchoIndex(i)).toBeLessThan(1);
      expect(opacityForEchoIndex(i)).toBeGreaterThan(0);
    }
  });
});
