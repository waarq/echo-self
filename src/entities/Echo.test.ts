import { describe, expect, it } from 'vitest';
import { Player, type PlayerActions } from './Player';
import { Echo } from './Echo';
import { EchoRecorder } from '../systems/EchoSystem';
import type { Vector2 } from '../core/Vector2';

const DT = 1 / 60;

interface Snapshot {
  position: Vector2;
  velocity: Vector2;
  facing: number;
  hp: number;
}

function snapshot(player: Player): Snapshot {
  return {
    position: { ...player.body.position },
    velocity: { ...player.body.velocity },
    facing: player.facing,
    hp: player.hp,
  };
}

/** A scripted input sequence exercising movement, a dash, and an attack —
 * the exact things an Echo has to reproduce faithfully. */
function scriptedInputs(tick: number): { moveAxis: Vector2; actions: PlayerActions } {
  if (tick < 20) return { moveAxis: { x: 1, y: 0 }, actions: { dash: false, attack: false } };
  if (tick === 20) return { moveAxis: { x: 1, y: 0 }, actions: { dash: true, attack: false } };
  if (tick < 40) return { moveAxis: { x: 0, y: 1 }, actions: { dash: false, attack: false } };
  if (tick === 40) return { moveAxis: { x: 0, y: 0 }, actions: { dash: false, attack: true } };
  return { moveAxis: { x: -1, y: -1 }, actions: { dash: false, attack: false } };
}

describe('Echo determinism', () => {
  it('reproduces the exact trajectory of the recorded run, tick for tick', () => {
    const live = new Player({ x: 0, y: 0 });
    const recorder = new EchoRecorder();
    const liveSnapshots: Snapshot[] = [];

    const TICKS = 90;
    for (let tick = 0; tick < TICKS; tick++) {
      const { moveAxis, actions } = scriptedInputs(tick);
      recorder.record(live.body.position, moveAxis, actions);
      live.update(DT, moveAxis, actions);
      liveSnapshots.push(snapshot(live));
    }

    const echo = new Echo(recorder.finalize());
    const echoSnapshots: Snapshot[] = [];
    for (let tick = 0; tick < TICKS; tick++) {
      echo.update(DT);
      echoSnapshots.push(snapshot(echo.player));
    }

    expect(echoSnapshots).toEqual(liveSnapshots);
  });

  it('spawns at the position the live player was at when recording started', () => {
    const live = new Player({ x: 42, y: -17 });
    const recorder = new EchoRecorder();
    recorder.record(live.body.position, { x: 0, y: 0 }, { dash: false, attack: false });
    live.update(DT, { x: 0, y: 0 }, { dash: false, attack: false });

    const echo = new Echo(recorder.finalize());
    expect(echo.player.body.position).toEqual({ x: 42, y: -17 });
  });

  it('re-anchors to the spawn position at the start of each loop, retracing the same path', () => {
    const recorder = new EchoRecorder();
    recorder.record({ x: 0, y: 0 }, { x: 1, y: 0 }, { dash: false, attack: false });
    const echo = new Echo(recorder.finalize());

    echo.update(DT);
    const afterFirstLoop = { ...echo.player.body.position };
    echo.update(DT); // wraps back to frame 0 — should retrace, not drift further
    const afterSecondLoop = { ...echo.player.body.position };

    expect(afterSecondLoop).toEqual(afterFirstLoop);
  });

  it('keeps retracing the exact same recorded path indefinitely across many loops', () => {
    const recorder = new EchoRecorder();
    recorder.record({ x: 0, y: 0 }, { x: 1, y: 0 }, { dash: false, attack: false });
    recorder.record({ x: 0, y: 0 }, { x: 0, y: 1 }, { dash: false, attack: false });
    const echo = new Echo(recorder.finalize());

    const positionsAtLoopEnd: Array<{ x: number; y: number }> = [];
    for (let loop = 0; loop < 5; loop++) {
      echo.update(DT);
      echo.update(DT);
      positionsAtLoopEnd.push({ ...echo.player.body.position });
    }

    for (const pos of positionsAtLoopEnd) {
      expect(pos).toEqual(positionsAtLoopEnd[0]);
    }
  });

  it('is alive by default and dies when its hp reaches zero', () => {
    const recorder = new EchoRecorder();
    recorder.record({ x: 0, y: 0 }, { x: 0, y: 0 }, { dash: false, attack: false });
    const echo = new Echo(recorder.finalize());
    expect(echo.alive).toBe(true);

    echo.player.takeDamage(3);
    expect(echo.alive).toBe(false);
  });

  it('stops updating once dead', () => {
    const recorder = new EchoRecorder();
    recorder.record({ x: 0, y: 0 }, { x: 1, y: 0 }, { dash: false, attack: false });
    const echo = new Echo(recorder.finalize());
    echo.player.takeDamage(3);
    const positionBefore = { ...echo.player.body.position };

    echo.update(DT);

    expect(echo.player.body.position).toEqual(positionBefore);
  });

  it('handles an empty recording without throwing', () => {
    const recorder = new EchoRecorder();
    const echo = new Echo(recorder.finalize());
    expect(() => echo.update(DT)).not.toThrow();
  });
});
