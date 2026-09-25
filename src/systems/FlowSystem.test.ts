import { describe, expect, it } from 'vitest';
import { FlowSystem, multiplierForFlow, tierForFlow } from './FlowSystem';

describe('multiplierForFlow', () => {
  it('is x1 at zero flow', () => {
    expect(multiplierForFlow(0)).toBe(1);
  });

  it('steps up at the documented thresholds', () => {
    expect(multiplierForFlow(24)).toBe(1);
    expect(multiplierForFlow(25)).toBe(2);
    expect(multiplierForFlow(49)).toBe(2);
    expect(multiplierForFlow(50)).toBe(4);
    expect(multiplierForFlow(74)).toBe(4);
    expect(multiplierForFlow(75)).toBe(8);
    expect(multiplierForFlow(100)).toBe(8);
  });
});

describe('tierForFlow', () => {
  it('matches the multiplier thresholds', () => {
    expect(tierForFlow(0)).toBe('LOW');
    expect(tierForFlow(25)).toBe('MEDIUM');
    expect(tierForFlow(50)).toBe('HIGH');
    expect(tierForFlow(75)).toBe('MAX');
  });
});

describe('FlowSystem', () => {
  it('starts at zero', () => {
    expect(new FlowSystem().value).toBe(0);
  });

  it('clamps to [0, FLOW_MAX]', () => {
    const flow = new FlowSystem();
    flow.add(1000);
    expect(flow.value).toBe(100);
    flow.add(-1000);
    expect(flow.value).toBe(0);
  });

  it('decays over time', () => {
    const flow = new FlowSystem();
    flow.add(50);
    flow.update(1);
    expect(flow.value).toBeLessThan(50);
  });

  it('loses a fixed amount on damage taken', () => {
    const flow = new FlowSystem();
    flow.add(50);
    flow.onDamageTaken();
    expect(flow.value).toBe(20);
  });

  it('never goes negative from damage', () => {
    const flow = new FlowSystem();
    flow.onDamageTaken();
    expect(flow.value).toBe(0);
  });
});
