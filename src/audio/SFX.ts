import { playTone, type ToneSpec } from './AudioEngine';

export type SfxName =
  | 'dash'
  | 'attack'
  | 'hit'
  | 'perfectDodge'
  | 'enemySpawn'
  | 'echoSpawn'
  | 'echoDeath'
  | 'playerDamage'
  | 'flowIncrease'
  | 'flowMax'
  | 'death';

/** Pure: PRD §23's required SFX list, mapped to a short synthesized tone
 * each. Kept separate from the actual WebAudio call so the mapping itself is
 * unit-testable without a browser. */
export function sfxSpec(name: SfxName): ToneSpec {
  switch (name) {
    case 'dash':
      return { frequency: 500, frequencyEnd: 900, duration: 0.1, type: 'sine', gain: 0.15 };
    case 'attack':
      return { frequency: 220, frequencyEnd: 120, duration: 0.08, type: 'square', gain: 0.15 };
    case 'hit':
      return { frequency: 150, frequencyEnd: 60, duration: 0.07, type: 'square', gain: 0.18 };
    case 'perfectDodge':
      return { frequency: 700, frequencyEnd: 1400, duration: 0.18, type: 'triangle', gain: 0.2 };
    case 'enemySpawn':
      return { frequency: 180, frequencyEnd: 260, duration: 0.15, type: 'sawtooth', gain: 0.08 };
    case 'echoSpawn':
      return { frequency: 300, frequencyEnd: 500, duration: 0.4, type: 'sine', gain: 0.12 };
    case 'echoDeath':
      return { frequency: 400, frequencyEnd: 80, duration: 0.3, type: 'sine', gain: 0.15 };
    case 'playerDamage':
      return { frequency: 140, frequencyEnd: 50, duration: 0.15, type: 'sawtooth', gain: 0.22 };
    case 'flowIncrease':
      return { frequency: 600, frequencyEnd: 900, duration: 0.12, type: 'triangle', gain: 0.12 };
    case 'flowMax':
      return { frequency: 800, frequencyEnd: 1600, duration: 0.35, type: 'triangle', gain: 0.2 };
    case 'death':
      return { frequency: 220, frequencyEnd: 40, duration: 0.6, type: 'sawtooth', gain: 0.25 };
  }
}

/** Gameplay code calls this by name (PRD Phase 2's sound hooks); Phase 9
 * fills in real synthesized playback behind that stable interface. */
export function playSfx(name: SfxName): void {
  playTone(sfxSpec(name));
}
