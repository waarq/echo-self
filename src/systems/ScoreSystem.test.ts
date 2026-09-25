import { describe, expect, it } from 'vitest';
import { ScoreSystem } from './ScoreSystem';

describe('ScoreSystem', () => {
  it('starts at zero', () => {
    expect(new ScoreSystem().rounded).toBe(0);
  });

  it('accrues survival score scaled by the multiplier', () => {
    const score = new ScoreSystem();
    score.addSurvivalTime(1, 1);
    const base = score.rounded;
    const score2 = new ScoreSystem();
    score2.addSurvivalTime(1, 4);
    expect(score2.rounded).toBe(base * 4);
  });

  it('awards a flat bonus per kill, scaled by multiplier', () => {
    const score = new ScoreSystem();
    score.addEnemyKill(2);
    expect(score.rounded).toBeGreaterThan(0);
    expect(score.rounded % 2).toBe(0);
  });

  it('accumulates across multiple sources', () => {
    const score = new ScoreSystem();
    score.addSurvivalTime(1, 1);
    score.addEnemyKill(1);
    score.addPerfectDodge(1);
    expect(score.rounded).toBeGreaterThan(0);
  });

  it('reset() returns the score to zero', () => {
    const score = new ScoreSystem();
    score.addEnemyKill(1);
    score.reset();
    expect(score.rounded).toBe(0);
  });
});
