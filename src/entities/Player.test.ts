import { describe, expect, it } from 'vitest';
import {
  ATTACK_COOLDOWN,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  Player,
  PLAYER_MAX_HP,
  PLAYER_MAX_SPEED,
} from './Player';

const NO_ACTIONS = { dash: false, attack: false };

describe('Player movement', () => {
  it('accelerates from rest toward max speed under sustained input', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 60; i++) {
      player.update(1 / 60, { x: 1, y: 0 }, NO_ACTIONS);
    }
    expect(player.body.velocity.x).toBeCloseTo(PLAYER_MAX_SPEED, 0);
  });

  it('never exceeds max speed even on diagonal input', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 120; i++) {
      player.update(1 / 60, { x: 1, y: 1 }, NO_ACTIONS);
    }
    const speed = Math.hypot(player.body.velocity.x, player.body.velocity.y);
    expect(speed).toBeLessThanOrEqual(PLAYER_MAX_SPEED + 0.01);
  });

  it('decelerates to a stop when input is released', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 60; i++) player.update(1 / 60, { x: 1, y: 0 }, NO_ACTIONS);
    for (let i = 0; i < 60; i++) player.update(1 / 60, { x: 0, y: 0 }, NO_ACTIONS);
    expect(player.body.velocity.x).toBeCloseTo(0, 1);
    expect(player.body.velocity.y).toBeCloseTo(0, 1);
  });

  it('retains last facing direction when input stops', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 1 }, NO_ACTIONS);
    const facingWhileMoving = player.facing;
    player.update(1 / 60, { x: 0, y: 0 }, NO_ACTIONS);
    expect(player.facing).toBe(facingWhileMoving);
  });

  it('moves position over time in the input direction', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < 30; i++) player.update(1 / 60, { x: 1, y: 0 }, NO_ACTIONS);
    expect(player.body.position.x).toBeGreaterThan(0);
    expect(player.body.position.y).toBeCloseTo(0);
  });
});

describe('Player dash', () => {
  it('reaches dash speed immediately on trigger', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    expect(Math.hypot(player.body.velocity.x, player.body.velocity.y)).toBeCloseTo(DASH_SPEED);
  });

  it('grants brief invulnerability while dashing', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    expect(player.isInvulnerable).toBe(true);
  });

  it('is unavailable again until the cooldown elapses', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    for (let i = 0; i < Math.ceil(DASH_DURATION * 60); i++) {
      player.update(1 / 60, { x: 0, y: 0 }, NO_ACTIONS);
    }
    expect(player.isDashing).toBe(false);
    const velocityBefore = { ...player.body.velocity };
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    // still on cooldown: should not have re-triggered dash speed
    expect(Math.hypot(player.body.velocity.x, player.body.velocity.y)).not.toBeCloseTo(DASH_SPEED);
    void velocityBefore;
  });

  it('is available again after the cooldown fully elapses', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    for (let i = 0; i < Math.ceil(DASH_COOLDOWN * 60) + 2; i++) {
      player.update(1 / 60, { x: 0, y: 0 }, NO_ACTIONS);
    }
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    expect(Math.hypot(player.body.velocity.x, player.body.velocity.y)).toBeCloseTo(DASH_SPEED);
  });

  it('falls back to current facing when no direction is available', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 1 }, NO_ACTIONS); // establish facing = down
    player.update(1 / 60, { x: 0, y: 0 }, { dash: true, attack: false });
    expect(player.body.velocity.y).toBeGreaterThan(0);
  });
});

describe('Player attack', () => {
  it('enters attacking state on trigger and exposes a hitbox', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, NO_ACTIONS); // face right
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    expect(player.isAttacking).toBe(true);
    expect(player.getAttackHitbox().facing).toBeCloseTo(0);
  });

  it('is unavailable again until the cooldown elapses', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    for (let i = 0; i < Math.ceil(ATTACK_COOLDOWN * 60) + 2; i++) {
      player.update(1 / 60, { x: 0, y: 0 }, NO_ACTIONS);
    }
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    expect(player.isAttacking).toBe(true);
  });

  it('cannot attack while dashing', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: true });
    expect(player.isAttacking).toBe(false);
  });
});

describe('Player health', () => {
  it('takes damage and becomes briefly invulnerable', () => {
    const player = new Player({ x: 0, y: 0 });
    player.takeDamage(1);
    expect(player.hp).toBe(PLAYER_MAX_HP - 1);
    expect(player.isInvulnerable).toBe(true);
  });

  it('ignores damage while invulnerable', () => {
    const player = new Player({ x: 0, y: 0 });
    player.takeDamage(1);
    player.takeDamage(1);
    expect(player.hp).toBe(PLAYER_MAX_HP - 1);
  });

  it('dies at zero hp', () => {
    const player = new Player({ x: 0, y: 0 });
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      player.takeDamage(1);
      player.invulnerableTimer = 0; // simulate time passing between hits
    }
    expect(player.isDead).toBe(true);
  });

  it('reset() restores full health, grants respawn invulnerability, and moves the body', () => {
    const player = new Player({ x: 0, y: 0 });
    player.takeDamage(1);
    player.reset({ x: 10, y: 10 });
    expect(player.hp).toBe(PLAYER_MAX_HP);
    expect(player.isInvulnerable).toBe(true);
    expect(player.body.position).toEqual({ x: 10, y: 10 });
  });
});
