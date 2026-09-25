import { describe, expect, it } from 'vitest';
import { accumulateSteps, FIXED_DT, MAX_FRAME_TIME } from './Time';

describe('accumulateSteps', () => {
  it('produces exactly one step for one fixed-dt frame', () => {
    const { steps, accumulator } = accumulateSteps(FIXED_DT, 0);
    expect(steps).toBe(1);
    expect(accumulator).toBeCloseTo(0, 10);
  });

  it('accumulates leftover time across calls to stay deterministic', () => {
    let acc = 0;
    let totalSteps = 0;
    // 200 frames at 30fps should yield the same number of fixed steps
    // regardless of frame-rate jitter.
    for (let i = 0; i < 200; i++) {
      const result = accumulateSteps(1 / 30, acc);
      totalSteps += result.steps;
      acc = result.accumulator;
    }
    expect(totalSteps).toBe(Math.floor((200 * (1 / 30)) / FIXED_DT));
  });

  it('clamps huge frame times (e.g. tab was backgrounded)', () => {
    const { steps } = accumulateSteps(5, 0);
    expect(steps).toBe(Math.floor(MAX_FRAME_TIME / FIXED_DT));
  });

  it('never produces negative accumulator', () => {
    const { accumulator } = accumulateSteps(FIXED_DT * 2.5, 0);
    expect(accumulator).toBeGreaterThanOrEqual(0);
  });
});
