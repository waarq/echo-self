import { describe, expect, it } from 'vitest';
import { Body } from './Body';
import { circlesOverlap, resolveBoundsCollision, type Bounds } from './Collision';

const bounds: Bounds = { minX: -100, minY: -100, maxX: 100, maxY: 100 };

describe('resolveBoundsCollision', () => {
  it('does nothing when the body is fully inside bounds', () => {
    const body = new Body({ x: 0, y: 0 }, 10);
    body.velocity = { x: 50, y: -30 };
    resolveBoundsCollision(body, bounds);
    expect(body.position).toEqual({ x: 0, y: 0 });
    expect(body.velocity).toEqual({ x: 50, y: -30 });
  });

  it('clamps position and zeroes outward velocity on the right wall', () => {
    const body = new Body({ x: 105, y: 0 }, 10);
    body.velocity = { x: 50, y: 0 };
    resolveBoundsCollision(body, bounds);
    expect(body.position.x).toBe(90);
    expect(body.velocity.x).toBe(0);
  });

  it('clamps position and zeroes outward velocity on the left wall', () => {
    const body = new Body({ x: -105, y: 0 }, 10);
    body.velocity = { x: -50, y: 0 };
    resolveBoundsCollision(body, bounds);
    expect(body.position.x).toBe(-90);
    expect(body.velocity.x).toBe(0);
  });

  it('does not zero velocity moving away from the wall it is touching', () => {
    const body = new Body({ x: 105, y: 0 }, 10);
    body.velocity = { x: -50, y: 0 };
    resolveBoundsCollision(body, bounds);
    expect(body.velocity.x).toBe(-50);
  });

  it('resolves both axes independently at a corner', () => {
    const body = new Body({ x: 105, y: 105 }, 10);
    body.velocity = { x: 20, y: 20 };
    resolveBoundsCollision(body, bounds);
    expect(body.position).toEqual({ x: 90, y: 90 });
    expect(body.velocity).toEqual({ x: 0, y: 0 });
  });
});

describe('circlesOverlap', () => {
  it('detects overlap', () => {
    const a = new Body({ x: 0, y: 0 }, 10);
    const b = new Body({ x: 15, y: 0 }, 10);
    expect(circlesOverlap(a, b)).toBe(true);
  });

  it('detects non-overlap', () => {
    const a = new Body({ x: 0, y: 0 }, 10);
    const b = new Body({ x: 25, y: 0 }, 10);
    expect(circlesOverlap(a, b)).toBe(false);
  });
});
