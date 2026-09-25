export const SCORE_PER_SECOND = 10;
export const SCORE_PER_ENEMY_KILL = 250;
export const SCORE_PER_PERFECT_DODGE = 100;
export const SCORE_PER_ECHO_KILL = 1000;

/** Placeholder scoring — PRD §25 explicitly calls the exact numbers
 * placeholders to tune later. Applies the Flow multiplier to every source so
 * maintaining Flow is directly rewarded (PRD §13). */
export class ScoreSystem {
  value = 0;

  addSurvivalTime(dt: number, multiplier: number): void {
    this.value += SCORE_PER_SECOND * dt * multiplier;
  }

  addEnemyKill(multiplier: number): void {
    this.value += SCORE_PER_ENEMY_KILL * multiplier;
  }

  addPerfectDodge(multiplier: number): void {
    this.value += SCORE_PER_PERFECT_DODGE * multiplier;
  }

  addEchoKill(multiplier: number): void {
    this.value += SCORE_PER_ECHO_KILL * multiplier;
  }

  get rounded(): number {
    return Math.floor(this.value);
  }
}
