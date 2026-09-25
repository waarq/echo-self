import { describe, expect, it } from 'vitest';
import { HitStopController } from './HitStop';

describe('HitStopController', () => {
  it('starts inactive', () => {
    const hitStop = new HitStopController();
    expect(hitStop.active).toBe(false);
    expect(hitStop.tick(1 / 60)).toBe(false);
  });

  it('becomes active after trigger() and ticks down to inactive', () => {
    const hitStop = new HitStopController();
    hitStop.trigger(0.1);
    expect(hitStop.active).toBe(true);

    expect(hitStop.tick(0.05)).toBe(true);
    expect(hitStop.active).toBe(true);

    expect(hitStop.tick(0.05)).toBe(true);
    expect(hitStop.active).toBe(false);

    expect(hitStop.tick(1 / 60)).toBe(false);
  });

  it('overlapping triggers take the longer duration rather than stacking additively', () => {
    const hitStop = new HitStopController();
    hitStop.trigger(0.05);
    hitStop.trigger(0.03);
    hitStop.tick(0.05);
    expect(hitStop.active).toBe(false);
  });

  it('a later, longer trigger extends the freeze', () => {
    const hitStop = new HitStopController();
    hitStop.trigger(0.02);
    hitStop.trigger(0.1);
    hitStop.tick(0.05);
    expect(hitStop.active).toBe(true);
  });

  it('never leaves the timer negative — a later tick after it expired reports inactive', () => {
    const hitStop = new HitStopController();
    hitStop.trigger(0.01);
    hitStop.tick(10); // huge dt overshoots the trigger duration
    expect(hitStop.tick(1 / 60)).toBe(false);
  });
});
