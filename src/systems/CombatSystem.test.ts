import { describe, expect, it } from 'vitest';
import { angleDiff, isInAttackArc, resolveCombat } from './CombatSystem';
import { Player } from '../entities/Player';
import { CHASER_MAX_HP, Enemy } from '../entities/Enemy';
import { Camera } from '../rendering/Camera';

describe('angleDiff', () => {
  it('is zero for identical angles', () => {
    expect(angleDiff(1, 1)).toBeCloseTo(0);
  });

  it('wraps around at the +/-PI boundary', () => {
    expect(Math.abs(angleDiff(Math.PI, -Math.PI))).toBeCloseTo(0);
  });

  it('returns the short way around', () => {
    expect(Math.abs(angleDiff(3, -3))).toBeLessThan(Math.PI);
  });
});

describe('isInAttackArc', () => {
  it('hits a target directly ahead within range', () => {
    const hit = isInAttackArc({ x: 0, y: 0 }, { x: 50, y: 0 }, 10, 0, 72, Math.PI / 2);
    expect(hit).toBe(true);
  });

  it('misses a target beyond range', () => {
    const hit = isInAttackArc({ x: 0, y: 0 }, { x: 500, y: 0 }, 10, 0, 72, Math.PI / 2);
    expect(hit).toBe(false);
  });

  it('misses a target behind the attacker', () => {
    const hit = isInAttackArc({ x: 0, y: 0 }, { x: -50, y: 0 }, 10, 0, 72, Math.PI / 2);
    expect(hit).toBe(false);
  });

  it('misses a target just outside the arc edge', () => {
    const hit = isInAttackArc({ x: 0, y: 0 }, { x: 0, y: 50 }, 10, 0, 72, Math.PI / 4);
    expect(hit).toBe(false);
  });
});

describe('resolveCombat', () => {
  it('damages and knocks back an enemy caught in the attack arc, reporting a hit', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const enemy = new Enemy({ x: 40, y: 0 });
    const camera = new Camera();

    const events = resolveCombat(player, [enemy], camera);

    expect(enemy.hp).toBe(1);
    expect(enemy.body.velocity.x).toBeGreaterThan(0);
    expect(events.hits).toBe(1);
    expect(events.kills).toBe(0);
  });

  it('reports a kill when the hit brings the enemy to 0 hp', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const enemy = new Enemy({ x: 40, y: 0 });
    enemy.hp = 1;
    const camera = new Camera();

    const events = resolveCombat(player, [enemy], camera);

    expect(events.kills).toBe(1);
    expect(enemy.alive).toBe(false);
  });

  it('only damages an enemy once per swing', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const enemy = new Enemy({ x: 40, y: 0 });
    const camera = new Camera();

    resolveCombat(player, [enemy], camera);
    resolveCombat(player, [enemy], camera);

    expect(enemy.hp).toBe(1);
  });

  it('damages the player on enemy contact when not invulnerable', () => {
    const player = new Player({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 5, y: 0 });
    const camera = new Camera();

    resolveCombat(player, [enemy], camera);

    expect(player.hp).toBe(2);
  });

  it('does not damage the player twice while invulnerable', () => {
    const player = new Player({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 5, y: 0 });
    const camera = new Camera();

    resolveCombat(player, [enemy], camera);
    resolveCombat(player, [enemy], camera);

    expect(player.hp).toBe(2);
  });

  it('does not damage a dead enemy', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const enemy = new Enemy({ x: 40, y: 0 });
    enemy.alive = false;
    const camera = new Camera();

    resolveCombat(player, [enemy], camera);

    expect(enemy.hp).toBe(CHASER_MAX_HP);
  });

  it('awards exactly one perfect dodge per dash overlapping an enemy', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    const enemy = new Enemy({ x: 5, y: 0 });
    const camera = new Camera();

    const first = resolveCombat(player, [enemy], camera);
    const second = resolveCombat(player, [enemy], camera);

    expect(first.perfectDodges).toBe(1);
    expect(second.perfectDodges).toBe(0);
  });

  it('does not damage the player mid-dash overlap (that is the dodge)', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 1, y: 0 }, { dash: true, attack: false });
    const enemy = new Enemy({ x: 5, y: 0 });
    const camera = new Camera();

    const events = resolveCombat(player, [enemy], camera);

    expect(events.playerHit).toBe(false);
    expect(player.hp).toBe(3);
  });
});
