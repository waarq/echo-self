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

/** Sound hook stub (PRD Phase 2: "sound hooks"). Real playback lands in
 * Phase 9 — gameplay code calls this now so wiring audio later doesn't
 * require touching every call site. */
export function playSfx(name: SfxName): void {
  void name;
}
