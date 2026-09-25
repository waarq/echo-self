import { describe, expect, it } from 'vitest';
import { MotionTrail } from './Trail';

describe('MotionTrail', () => {
  it('starts with no points', () => {
    expect(new MotionTrail(0.25).points).toHaveLength(0);
  });

  it('record() adds a point at full alpha', () => {
    const trail = new MotionTrail(0.25);
    trail.record({ x: 5, y: 10 });
    expect(trail.points).toHaveLength(1);
    expect(trail.points[0].position).toEqual({ x: 5, y: 10 });
    expect(trail.points[0].alpha).toBe(1);
  });

  it('update() fades points toward zero alpha as they age', () => {
    const trail = new MotionTrail(0.2);
    trail.record({ x: 0, y: 0 });
    trail.update(0.1);
    expect(trail.points[0].alpha).toBeCloseTo(0.5, 5);
  });

  it('update() drops points once they exceed the trail lifetime', () => {
    const trail = new MotionTrail(0.2);
    trail.record({ x: 0, y: 0 });
    trail.update(0.1);
    expect(trail.points).toHaveLength(1);
    trail.update(0.2);
    expect(trail.points).toHaveLength(0);
  });

  it('clear() removes every point immediately', () => {
    const trail = new MotionTrail(1);
    trail.record({ x: 0, y: 0 });
    trail.record({ x: 1, y: 1 });
    trail.clear();
    expect(trail.points).toHaveLength(0);
  });
});
