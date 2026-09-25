import { describe, expect, it } from 'vitest';
import {
  DifficultyDirector,
  arenaComplexityForElapsed,
  enemyRespawnDelayForElapsed,
  maxActiveEchoesForElapsed,
  maxEnemiesForElapsed,
  tierForElapsed,
} from './DifficultyDirector';
import { ECHO_RECORDING_DURATION_SEC } from './EchoSystem';

describe('tierForElapsed', () => {
  it('starts at INTRO', () => {
    expect(tierForElapsed(0)).toBe('INTRO');
    expect(tierForElapsed(29)).toBe('INTRO');
  });

  it('steps through the PRD §15 time bands', () => {
    expect(tierForElapsed(30)).toBe('FIRST_ECHO');
    expect(tierForElapsed(60)).toBe('MULTIPLE_THREATS');
    expect(tierForElapsed(120)).toBe('HAZARDS');
    expect(tierForElapsed(180)).toBe('MULTIPLE_ECHOES');
    expect(tierForElapsed(300)).toBe('ECHO_INTERACTIONS');
    expect(tierForElapsed(600)).toBe('HIGH_DENSITY');
  });

  it('never regresses to an earlier tier as time keeps increasing', () => {
    expect(tierForElapsed(10_000)).toBe('HIGH_DENSITY');
  });
});

describe('maxEnemiesForElapsed', () => {
  it('starts at the floor during INTRO', () => {
    expect(maxEnemiesForElapsed(0)).toBe(1);
    expect(maxEnemiesForElapsed(59)).toBe(1);
  });

  it('ramps up over time', () => {
    expect(maxEnemiesForElapsed(60)).toBe(1);
    expect(maxEnemiesForElapsed(150)).toBe(2);
    expect(maxEnemiesForElapsed(240)).toBe(3);
  });

  it('is monotonically non-decreasing and hard-capped so the field can never grow unbounded', () => {
    let previous = maxEnemiesForElapsed(0);
    for (let t = 0; t <= 5000; t += 30) {
      const current = maxEnemiesForElapsed(t);
      expect(current).toBeGreaterThanOrEqual(previous);
      expect(current).toBeLessThanOrEqual(5);
      previous = current;
    }
  });
});

describe('enemyRespawnDelayForElapsed', () => {
  it('starts at the slowest delay', () => {
    expect(enemyRespawnDelayForElapsed(0)).toBeCloseTo(1.2, 5);
  });

  it('tightens over time but never drops below the floor', () => {
    expect(enemyRespawnDelayForElapsed(120)).toBeLessThan(1.2);
    expect(enemyRespawnDelayForElapsed(240)).toBeCloseTo(0.5, 5);
    expect(enemyRespawnDelayForElapsed(10_000)).toBeCloseTo(0.5, 5);
  });

  it('is monotonically non-increasing', () => {
    let previous = enemyRespawnDelayForElapsed(0);
    for (let t = 0; t <= 500; t += 10) {
      const current = enemyRespawnDelayForElapsed(t);
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });
});

describe('arenaComplexityForElapsed', () => {
  it('starts at the minimum used for the initial arena', () => {
    expect(arenaComplexityForElapsed(0)).toBe(2);
  });

  it('ramps toward the ceiling and clamps there', () => {
    expect(arenaComplexityForElapsed(180)).toBe(6);
    expect(arenaComplexityForElapsed(10_000)).toBe(6);
  });
});

describe('maxActiveEchoesForElapsed', () => {
  it('is zero before the first Echo can exist', () => {
    expect(maxActiveEchoesForElapsed(0)).toBe(0);
    expect(maxActiveEchoesForElapsed(ECHO_RECORDING_DURATION_SEC - 1)).toBe(0);
  });

  it('allows exactly one Echo as soon as the first recording finishes', () => {
    expect(maxActiveEchoesForElapsed(ECHO_RECORDING_DURATION_SEC)).toBe(1);
  });

  it('ramps up and hard-caps so the field of Echoes stays survivable', () => {
    expect(maxActiveEchoesForElapsed(ECHO_RECORDING_DURATION_SEC + 60)).toBe(2);
    expect(maxActiveEchoesForElapsed(ECHO_RECORDING_DURATION_SEC + 600)).toBe(4);
    expect(maxActiveEchoesForElapsed(100_000)).toBe(4);
  });
});

describe('DifficultyDirector', () => {
  it('starts at elapsed zero with INTRO-tier knobs', () => {
    const director = new DifficultyDirector();
    expect(director.elapsedSeconds).toBe(0);
    expect(director.tier).toBe('INTRO');
    expect(director.maxEnemies).toBe(1);
    expect(director.maxActiveEchoes).toBe(0);
  });

  it('accumulates elapsed time across update() calls and its getters track the pure functions', () => {
    const director = new DifficultyDirector();
    for (let i = 0; i < 300; i++) director.update(1);
    expect(director.elapsedSeconds).toBeCloseTo(300, 5);
    expect(director.tier).toBe(tierForElapsed(300));
    expect(director.maxEnemies).toBe(maxEnemiesForElapsed(300));
    expect(director.enemyRespawnDelay).toBe(enemyRespawnDelayForElapsed(300));
    expect(director.arenaComplexity).toBe(arenaComplexityForElapsed(300));
    expect(director.maxActiveEchoes).toBe(maxActiveEchoesForElapsed(300));
  });
});
