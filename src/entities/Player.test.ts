import { describe, expect, it } from 'vitest';
import { Player, PLAYER_MAX_SPEED } from './Player';

describe('Player', () => {
  it('accelerates from rest toward max speed under sustained input', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 60; i++) {
      player.update(1 / 60, { x: 1, y: 0 });
    }
    expect(player.body.velocity.x).toBeCloseTo(PLAYER_MAX_SPEED, 0);
  });

  it('never exceeds max speed even on diagonal input', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 120; i++) {
      player.update(1 / 60, { x: 1, y: 1 });
    }
    const speed = Math.hypot(player.body.velocity.x, player.body.velocity.y);
    expect(speed).toBeLessThanOrEqual(PLAYER_MAX_SPEED + 0.01);
  });

  it('decelerates to a stop when input is released', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 60; i++) player.update(1 / 60, { x: 1, y: 0 });
    for (let i = 0; i < 60; i++) player.update(1 / 60, { x: 0, y: 0 });
    expect(player.body.velocity.x).toBeCloseTo(0, 1);
    expect(player.body.velocity.y).toBeCloseTo(0, 1);
  });

  it('retains last facing direction when input stops', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 1 });
    const facingWhileMoving = player.facing;
    player.update(1 / 60, { x: 0, y: 0 });
    expect(player.facing).toBe(facingWhileMoving);
  });

  it('moves position over time in the input direction', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 30; i++) player.update(1 / 60, { x: 1, y: 0 });
    expect(player.body.position.x).toBeGreaterThan(0);
    expect(player.body.position.y).toBeCloseTo(0);
  });
});
