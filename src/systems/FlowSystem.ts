export const FLOW_MAX = 100;
const FLOW_DECAY_PER_SEC = 4;

export const FLOW_GAIN_HIT = 8;
export const FLOW_GAIN_KILL = 15;
export const FLOW_GAIN_PERFECT_DODGE = 20;
export const FLOW_GAIN_ECHO_KILL = 25;
export const FLOW_LOSS_ON_DAMAGE = 30;

export type FlowTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX';

/** Pure: Flow -> score multiplier, per PRD §13's example tiers. */
export function multiplierForFlow(flow: number): number {
  if (flow >= 75) return 8;
  if (flow >= 50) return 4;
  if (flow >= 25) return 2;
  return 1;
}

export function tierForFlow(flow: number): FlowTier {
  if (flow >= 75) return 'MAX';
  if (flow >= 50) return 'HIGH';
  if (flow >= 25) return 'MEDIUM';
  return 'LOW';
}

/** Player's temporary momentum score (PRD §12). Rises from aggressive,
 * skillful play and passively decays — a risk/reward meter, never a
 * requirement to survive. */
export class FlowSystem {
  value = 0;

  add(amount: number): void {
    this.value = Math.max(0, Math.min(FLOW_MAX, this.value + amount));
  }

  reset(): void {
    this.value = 0;
  }

  onDamageTaken(): void {
    this.add(-FLOW_LOSS_ON_DAMAGE);
  }

  update(dt: number): void {
    this.add(-FLOW_DECAY_PER_SEC * dt);
  }

  get multiplier(): number {
    return multiplierForFlow(this.value);
  }

  get tier(): FlowTier {
    return tierForFlow(this.value);
  }
}
