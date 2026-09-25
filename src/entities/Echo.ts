import { Player } from './Player';
import type { EchoRecording } from '../systems/EchoSystem';
import { frameToActions } from '../systems/EchoSystem';

let nextEchoId = 1;

/** A translucent autonomous clone of a past run, driven entirely by a
 * recorded input stream rather than live input. Wraps a full Player instance
 * so it gets identical movement/dash/attack/health simulation for free — an
 * Echo is not a weaker imitation, it is the player (PRD §4, §18). Loops its
 * recording forever once alive; once killed it's gone for good. */
export class Echo {
  readonly id: number;
  readonly player: Player;
  private readonly recording: EchoRecording;
  private frameIndex = 0;

  constructor(recording: EchoRecording) {
    this.id = nextEchoId++;
    this.recording = recording;
    this.player = new Player(recording.spawnPosition);
  }

  get alive(): boolean {
    return !this.player.isDead;
  }

  update(dt: number): void {
    if (!this.alive || this.recording.frames.length === 0) return;

    const loopIndex = this.frameIndex % this.recording.frames.length;
    if (loopIndex === 0 && this.frameIndex > 0) {
      // Re-anchor to the recorded path at the start of each loop — without
      // this, replaying "move right for 3s" a second time compounds onto
      // wherever the body ended up, drifting further from the recording
      // every cycle instead of retracing the same path (PRD §5).
      this.player.body.position = { ...this.recording.spawnPosition };
      this.player.body.velocity = { x: 0, y: 0 };
    }

    const frame = this.recording.frames[loopIndex];
    this.frameIndex += 1;
    this.player.update(dt, { x: frame.moveX, y: frame.moveY }, frameToActions(frame));
  }
}
