import { describe, expect, it } from 'vitest';
import { EchoRecorder } from './EchoSystem';

describe('EchoRecorder', () => {
  it('captures the position of the first recorded tick as spawn position', () => {
    const recorder = new EchoRecorder();
    recorder.record({ x: 5, y: 10 }, { x: 0, y: 0 }, { dash: false, attack: false });
    recorder.record({ x: 6, y: 10 }, { x: 1, y: 0 }, { dash: false, attack: false });
    expect(recorder.finalize().spawnPosition).toEqual({ x: 5, y: 10 });
  });

  it('records one frame per call', () => {
    const recorder = new EchoRecorder();
    for (let i = 0; i < 10; i++) {
      recorder.record({ x: 0, y: 0 }, { x: 0, y: 0 }, { dash: false, attack: false });
    }
    expect(recorder.tickCount).toBe(10);
  });

  it('is not full until the duration is reached at the given fixed dt', () => {
    const recorder = new EchoRecorder();
    for (let i = 0; i < 59; i++) {
      recorder.record({ x: 0, y: 0 }, { x: 0, y: 0 }, { dash: false, attack: false });
    }
    expect(recorder.isFull(1 / 60, 1)).toBe(false);
    recorder.record({ x: 0, y: 0 }, { x: 0, y: 0 }, { dash: false, attack: false });
    expect(recorder.isFull(1 / 60, 1)).toBe(true);
  });

  it('finalize() with no frames yields an empty recording, not a crash', () => {
    const recorder = new EchoRecorder();
    const recording = recorder.finalize();
    expect(recording.frames).toEqual([]);
    expect(recording.spawnPosition).toEqual({ x: 0, y: 0 });
  });

  it('preserves dash direction hints and action flags per frame', () => {
    const recorder = new EchoRecorder();
    recorder.record(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { dash: true, attack: false, dashDirectionHint: { x: 0.5, y: -0.5 } },
    );
    const frame = recorder.finalize().frames[0];
    expect(frame.dash).toBe(true);
    expect(frame.dashHintX).toBeCloseTo(0.5);
    expect(frame.dashHintY).toBeCloseTo(-0.5);
  });
});
