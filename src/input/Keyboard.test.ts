import { describe, expect, it } from 'vitest';
import { axisFromKeys } from './Keyboard';

describe('axisFromKeys', () => {
  it('returns zero axis when nothing is held', () => {
    expect(axisFromKeys(new Set())).toEqual({ x: 0, y: 0 });
  });

  it('maps WASD to axes', () => {
    expect(axisFromKeys(new Set(['KeyD']))).toEqual({ x: 1, y: 0 });
    expect(axisFromKeys(new Set(['KeyA']))).toEqual({ x: -1, y: 0 });
    expect(axisFromKeys(new Set(['KeyW']))).toEqual({ x: 0, y: -1 });
    expect(axisFromKeys(new Set(['KeyS']))).toEqual({ x: 0, y: 1 });
  });

  it('maps arrow keys identically to WASD', () => {
    expect(axisFromKeys(new Set(['ArrowRight']))).toEqual({ x: 1, y: 0 });
  });

  it('cancels opposite keys held simultaneously', () => {
    expect(axisFromKeys(new Set(['KeyA', 'KeyD']))).toEqual({ x: 0, y: 0 });
  });

  it('combines two axes for diagonal movement', () => {
    expect(axisFromKeys(new Set(['KeyD', 'KeyW']))).toEqual({ x: 1, y: -1 });
  });
});
