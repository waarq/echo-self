import { describe, expect, it } from 'vitest';
import { formatSurvivalTime } from './ResultsScreen';

describe('formatSurvivalTime', () => {
  it('formats zero as 00:00', () => {
    expect(formatSurvivalTime(0)).toBe('00:00');
  });

  it('pads seconds under a minute', () => {
    expect(formatSurvivalTime(7)).toBe('00:07');
  });

  it('formats minutes and seconds, matching the PRD §27 example', () => {
    expect(formatSurvivalTime(4 * 60 + 37)).toBe('04:37');
  });

  it('floors fractional seconds', () => {
    expect(formatSurvivalTime(59.9)).toBe('00:59');
  });

  it('rolls over into the next minute at 60s', () => {
    expect(formatSurvivalTime(60)).toBe('01:00');
  });

  it('clamps negative input to zero', () => {
    expect(formatSurvivalTime(-5)).toBe('00:00');
  });
});
