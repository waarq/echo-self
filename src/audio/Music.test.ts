import { describe, expect, it } from 'vitest';
import { intensityForTier, MusicDirector } from './Music';

describe('intensityForTier', () => {
  it('has no percussion pulse at LOW Flow ("minimal ambient rhythm")', () => {
    expect(intensityForTier('LOW').pulseIntervalSec).toBe(0);
    expect(intensityForTier('LOW').pulseGain).toBe(0);
  });

  it('drone gain climbs monotonically with Flow tier', () => {
    const tiers = ['LOW', 'MEDIUM', 'HIGH', 'MAX'] as const;
    let previous = -Infinity;
    for (const tier of tiers) {
      const gain = intensityForTier(tier).droneGain;
      expect(gain).toBeGreaterThan(previous);
      previous = gain;
    }
  });

  it('the percussion pulse speeds up (shorter interval) as Flow climbs', () => {
    expect(intensityForTier('MEDIUM').pulseIntervalSec).toBeGreaterThan(
      intensityForTier('HIGH').pulseIntervalSec,
    );
    expect(intensityForTier('HIGH').pulseIntervalSec).toBeGreaterThan(
      intensityForTier('MAX').pulseIntervalSec,
    );
  });
});

describe('MusicDirector', () => {
  it('is a safe no-op outside a browser (no AudioContext in this test environment)', () => {
    const music = new MusicDirector();
    expect(() => {
      music.start();
      music.update(1 / 60, 'MAX');
      music.stop();
    }).not.toThrow();
  });
});
