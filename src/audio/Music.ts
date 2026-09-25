import type { FlowTier } from '../systems/FlowSystem';
import { playTone, startToneLayer, type ToneLayer } from './AudioEngine';

export interface MusicIntensity {
  droneGain: number;
  pulseGain: number;
  /** 0 disables the percussion pulse entirely (PRD §23: "low Flow: minimal
   * ambient rhythm" — no percussion yet at LOW). */
  pulseIntervalSec: number;
}

/** Pure: PRD §23's Flow -> music intensity mapping. Gain and pulse rate both
 * climb with Flow so "low flow: minimal ambient" through "maximum flow:
 * high-adrenaline" is a smooth, monotonic ramp rather than a hard cut. */
export function intensityForTier(tier: FlowTier): MusicIntensity {
  switch (tier) {
    case 'LOW':
      return { droneGain: 0.05, pulseGain: 0, pulseIntervalSec: 0 };
    case 'MEDIUM':
      return { droneGain: 0.06, pulseGain: 0.05, pulseIntervalSec: 0.6 };
    case 'HIGH':
      return { droneGain: 0.07, pulseGain: 0.08, pulseIntervalSec: 0.35 };
    case 'MAX':
      return { droneGain: 0.08, pulseGain: 0.12, pulseIntervalSec: 0.2 };
  }
}

const DRONE_FREQUENCY = 55; // A1 — low enough to sit under SFX without masking them
const PULSE_FREQUENCY = 220;
const GAIN_RAMP_SEC = 1.2; // slow ramp so tier changes feel like a swell, not a jump

/** Procedurally generated ambient music (PRD §23) — a low drone whose volume
 * tracks Flow, plus a percussion-style pulse that appears and speeds up as
 * Flow climbs. Synthesized rather than sampled for the same reason as SFX:
 * no audio assets exist yet (Phase 10). */
export class MusicDirector {
  private drone: ToneLayer | null = null;
  private pulseTimer = 0;
  private currentIntensity: MusicIntensity = intensityForTier('LOW');

  start(): void {
    if (this.drone) return;
    this.drone = startToneLayer(DRONE_FREQUENCY, 'sine');
    this.drone?.setGain(this.currentIntensity.droneGain, GAIN_RAMP_SEC);
  }

  stop(): void {
    this.drone?.stop();
    this.drone = null;
    this.pulseTimer = 0;
  }

  update(dt: number, tier: FlowTier): void {
    if (!this.drone) return;
    const intensity = intensityForTier(tier);
    if (intensity.droneGain !== this.currentIntensity.droneGain) {
      this.drone.setGain(intensity.droneGain, GAIN_RAMP_SEC);
    }
    this.currentIntensity = intensity;

    if (intensity.pulseIntervalSec <= 0) {
      this.pulseTimer = 0;
      return;
    }
    this.pulseTimer -= dt;
    if (this.pulseTimer <= 0) {
      playTone({
        frequency: PULSE_FREQUENCY,
        duration: 0.06,
        type: 'triangle',
        gain: intensity.pulseGain,
      });
      this.pulseTimer = intensity.pulseIntervalSec;
    }
  }
}
