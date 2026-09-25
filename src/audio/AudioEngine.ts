/** Thin WebAudio wrapper. There are no audio assets in the repo (the anime
 * art pass with real assets is Phase 10) so every sound is synthesized with
 * oscillators — cheap, deterministic to describe, and needs no asset
 * pipeline. Guarded so it's a safe no-op outside a browser (SSR/tests run in
 * Node, same reasoning as Keyboard/Mouse/Touch not touching `window` at
 * import time). */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  // Browsers suspend the context until a user gesture; every play call retries
  // resume() rather than requiring separate unlock plumbing, since by the time
  // any sound plays the player has already interacted (MENU requires a
  // keypress/click/tap to advance).
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function getAudioContext(): AudioContext | null {
  return getContext();
}

export interface ToneSpec {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  /** If set, the oscillator sweeps from `frequency` to this over `duration`. */
  frequencyEnd?: number;
}

/** Plays one short synthesized tone with an exponential attack/decay
 * envelope (a linear one clicks audibly at the start/end). */
export function playTone(spec: ToneSpec): void {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime;

  osc.type = spec.type ?? 'sine';
  osc.frequency.setValueAtTime(Math.max(1, spec.frequency), now);
  if (spec.frequencyEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.frequencyEnd), now + spec.duration);
  }

  const peakGain = spec.gain ?? 0.2;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
}

/** A continuously-running oscillator + gain pair whose gain can be ramped
 * smoothly over time — the building block for the ambient drone/pulse layers
 * in Music.ts. */
export interface ToneLayer {
  setGain(value: number, rampSec: number): void;
  stop(): void;
}

export function startToneLayer(frequency: number, type: OscillatorType = 'sine'): ToneLayer | null {
  const audioCtx = getContext();
  if (!audioCtx) return null;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start();

  return {
    setGain(value: number, rampSec: number): void {
      const t = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(t);
      gainNode.gain.setValueAtTime(Math.max(0.0001, gainNode.gain.value), t);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, value),
        t + Math.max(0.001, rampSec),
      );
    },
    stop(): void {
      osc.stop();
    },
  };
}
