import { describe, expect, it } from 'vitest';
import { CHASER_MAX_HP, Enemy } from './Enemy';

describe('Enemy (Chaser)', () => {
  it('accelerates toward the target position', () => {
    const enemy = new Enemy({ x: 0, y: 0 });
    for (let i = 0; i < 60; i++) enemy.update(1 / 60, { x: 500, y: 0 });
    expect(enemy.body.position.x).toBeGreaterThan(0);
    expect(enemy.body.velocity.x).toBeGreaterThan(0);
  });

  it('dies after enough damage', () => {
    const enemy = new Enemy({ x: 0, y: 0 });
    for (let i = 0; i < CHASER_MAX_HP; i++) enemy.takeDamage(1);
    expect(enemy.alive).toBe(false);
    expect(enemy.hp).toBeLessThanOrEqual(0);
  });

  it('stays alive with partial damage', () => {
    const enemy = new Enemy({ x: 0, y: 0 });
    enemy.takeDamage(1);
    expect(enemy.alive).toBe(CHASER_MAX_HP > 1);
  });

  it('does not update once dead', () => {
    const enemy = new Enemy({ x: 0, y: 0 });
    enemy.alive = false;
    enemy.update(1 / 60, { x: 500, y: 0 });
    expect(enemy.body.position).toEqual({ x: 0, y: 0 });
  });
});
