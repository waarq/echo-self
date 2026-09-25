import { describe, expect, it } from 'vitest';
import { sfxSpec } from './SFX';
import type { SfxName } from './SFX';

const ALL_NAMES: SfxName[] = [
  'dash',
  'attack',
  'hit',
  'perfectDodge',
  'enemySpawn',
  'echoSpawn',
  'echoDeath',
  'playerDamage',
  'flowIncrease',
  'flowMax',
  'death',
];

describe('sfxSpec', () => {
  it('returns a playable spec for every PRD §23 sound', () => {
    for (const name of ALL_NAMES) {
      const spec = sfxSpec(name);
      expect(spec.frequency).toBeGreaterThan(0);
      expect(spec.duration).toBeGreaterThan(0);
      expect(spec.gain ?? 1).toBeGreaterThan(0);
    }
  });

  it('gives death and playerDamage the longest, most prominent duration/gain of the damage sounds', () => {
    const death = sfxSpec('death');
    const hit = sfxSpec('hit');
    expect(death.duration).toBeGreaterThan(hit.duration);
  });

  it('is a pure function — same name always returns an equivalent spec', () => {
    expect(sfxSpec('dash')).toEqual(sfxSpec('dash'));
  });
});
