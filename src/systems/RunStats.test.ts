import { describe, expect, it } from 'vitest';
import { RunStats } from './RunStats';

describe('RunStats', () => {
  it('starts at zero survival time and defaults', () => {
    const stats = new RunStats();
    expect(stats.survivalTimeSec).toBe(0);
    expect(stats.echoesCreated).toBe(0);
    expect(stats.perfectDodges).toBe(0);
    expect(stats.maxFlowMultiplier).toBe(1);
  });

  it('accumulates survival time', () => {
    const stats = new RunStats();
    stats.update(0.5);
    stats.update(0.25);
    expect(stats.survivalTimeSec).toBeCloseTo(0.75, 5);
  });

  it('counts echoes created and perfect dodges', () => {
    const stats = new RunStats();
    stats.onEchoCreated();
    stats.onEchoCreated();
    stats.onPerfectDodges(3);
    expect(stats.echoesCreated).toBe(2);
    expect(stats.perfectDodges).toBe(3);
  });

  it('tracks the highest Flow multiplier seen, never decreasing', () => {
    const stats = new RunStats();
    stats.trackFlowMultiplier(2);
    stats.trackFlowMultiplier(8);
    stats.trackFlowMultiplier(4);
    expect(stats.maxFlowMultiplier).toBe(8);
  });

  it('reset() restores every field to its initial value', () => {
    const stats = new RunStats();
    stats.update(10);
    stats.onEchoCreated();
    stats.onPerfectDodges(5);
    stats.trackFlowMultiplier(8);
    stats.reset();
    expect(stats.survivalTimeSec).toBe(0);
    expect(stats.echoesCreated).toBe(0);
    expect(stats.perfectDodges).toBe(0);
    expect(stats.maxFlowMultiplier).toBe(1);
  });
});
