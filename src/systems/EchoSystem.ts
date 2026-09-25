import type { Vector2 } from '../core/Vector2';
import type { PlayerActions } from '../entities/Player';

export const ECHO_RECORDING_DURATION_SEC = 15;

/** One fixed-timestep tick of recorded player intent. Deliberately just the
 * input, not position/velocity snapshots — replaying the same inputs through
 * the same deterministic Player simulation reproduces the exact same
 * trajectory, which is both simpler and far more compact than recording
 * full state every frame (PRD §4, §35). */
export interface EchoInputFrame {
  moveX: number;
  moveY: number;
  dash: boolean;
  attack: boolean;
  dashHintX: number;
  dashHintY: number;
}

export interface EchoRecording {
  frames: EchoInputFrame[];
  spawnPosition: Vector2;
}

export function frameToActions(frame: EchoInputFrame): PlayerActions {
  return {
    dash: frame.dash,
    attack: frame.attack,
    dashDirectionHint: { x: frame.dashHintX, y: frame.dashHintY },
  };
}

/** Records the live player's per-tick input during a run. Call record()
 * once per fixed simulation step; finalize() hands off an immutable
 * recording once the window is full (PRD §4 Echo Timeline). */
export class EchoRecorder {
  private frames: EchoInputFrame[] = [];
  private spawnPosition: Vector2 | null = null;

  record(position: Vector2, moveAxis: Vector2, actions: PlayerActions): void {
    if (!this.spawnPosition) this.spawnPosition = { ...position };
    this.frames.push({
      moveX: moveAxis.x,
      moveY: moveAxis.y,
      dash: actions.dash,
      attack: actions.attack,
      dashHintX: actions.dashDirectionHint?.x ?? 0,
      dashHintY: actions.dashDirectionHint?.y ?? 0,
    });
  }

  isFull(fixedDt: number, durationSec: number = ECHO_RECORDING_DURATION_SEC): boolean {
    return this.frames.length * fixedDt >= durationSec;
  }

  get tickCount(): number {
    return this.frames.length;
  }

  finalize(): EchoRecording {
    return { frames: this.frames, spawnPosition: this.spawnPosition ?? { x: 0, y: 0 } };
  }
}
