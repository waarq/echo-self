import { describe, expect, it } from 'vitest';
import { axisFromDrag, TOUCH_DEADZONE_PX, TOUCH_MAX_DRAG_PX } from './Touch';

describe('axisFromDrag', () => {
  it('is zero within the deadzone', () => {
    expect(axisFromDrag({ x: TOUCH_DEADZONE_PX - 1, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('is zero at the exact origin', () => {
    expect(axisFromDrag({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('has near-zero intensity just past the deadzone', () => {
    const result = axisFromDrag({ x: TOUCH_DEADZONE_PX + 1, y: 0 });
    expect(Math.hypot(result.x, result.y)).toBeGreaterThan(0);
    expect(Math.hypot(result.x, result.y)).toBeLessThan(0.1);
  });

  it('reaches full intensity at or beyond max drag distance', () => {
    const result = axisFromDrag({ x: TOUCH_MAX_DRAG_PX, y: 0 });
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1);
  });

  it('caps intensity at 1 beyond max drag distance', () => {
    const result = axisFromDrag({ x: TOUCH_MAX_DRAG_PX * 3, y: 0 });
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1);
  });

  it('preserves direction', () => {
    const result = axisFromDrag({ x: 0, y: TOUCH_MAX_DRAG_PX });
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeGreaterThan(0);
  });
});
