import { describe, expect, it } from 'vitest';
import {
  angleDiff,
  isInAttackArc,
  resolveCombat,
  resolveEchoCombat,
  resolveEnemyEchoCombat,
  resolveEchoVsEchoCombat,
} from './CombatSystem';
import { Player } from '../entities/Player';
import { CHASER_MAX_HP, Enemy } from '../entities/Enemy';
import { Echo } from '../entities/Echo';
import { EchoRecorder } from './EchoSystem';
import { Camera } from '../rendering/Camera';

function makeEcho(position: { x: number; y: number }): Echo {
  const recorder = new EchoRecorder();
  recorder.record(position, { x: 0, y: 0 }, { dash: false, attack: false });
  return new Echo(recorder.finalize());
}

/** Builds an Echo whose player is already mid-attack, facing +x, so it can
 * be used as an attacker against a target placed ahead of it. */
function makeAttackingEcho(position: { x: number; y: number }): Echo {
  const echo = makeEcho(position);
  echo.player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
  return echo;
}

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

describe('resolveEchoCombat', () => {
  it('lets the live player damage and kill an echo with its attack, just like an enemy', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const echo = makeEcho({ x: 40, y: 0 });
    const camera = new Camera();

    const events = resolveEchoCombat(player, [echo], camera);

    expect(echo.player.hp).toBe(2);
    expect(events.hits).toBe(1);
  });

  it('reports a kill and marks the echo dead at 0 hp', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const echo = makeEcho({ x: 40, y: 0 });
    echo.player.hp = 1;
    const camera = new Camera();

    const events = resolveEchoCombat(player, [echo], camera);

    expect(events.kills).toBe(1);
    expect(echo.alive).toBe(false);
  });

  it('does not let a dead echo be hit again', () => {
    const player = new Player({ x: 0, y: 0 });
    player.update(1 / 60, { x: 0, y: 0 }, { dash: false, attack: true });
    const echo = makeEcho({ x: 40, y: 0 });
    echo.player.hp = 0;
    const camera = new Camera();

    const events = resolveEchoCombat(player, [echo], camera);

    expect(events.hits).toBe(0);
  });

  it("damages the live player via the echo's own arc attack, not contact", () => {
    const player = new Player({ x: 0, y: 0 });
    const echo = makeEcho({ x: 30, y: 0 });
    echo.player.update(1 / 60, { x: -1, y: 0 }, { dash: false, attack: true });
    const camera = new Camera();

    const events = resolveEchoCombat(player, [echo], camera);

    expect(events.playerHit).toBe(true);
    expect(player.hp).toBe(2);
  });

  it('does not damage the player from echo contact alone (no attack active)', () => {
    const player = new Player({ x: 0, y: 0 });
    const echo = makeEcho({ x: 5, y: 0 }); // overlapping, but not attacking
    const camera = new Camera();

    const events = resolveEchoCombat(player, [echo], camera);

    expect(events.playerHit).toBe(false);
    expect(player.hp).toBe(3);
  });

  it("does not double-hit the player from the echo's single swing", () => {
    const player = new Player({ x: 0, y: 0 });
    const echo = makeEcho({ x: 30, y: 0 });
    echo.player.update(1 / 60, { x: -1, y: 0 }, { dash: false, attack: true });
    const camera = new Camera();

    resolveEchoCombat(player, [echo], camera);
    player.invulnerableTimer = 0; // simulate i-frames expiring between frames
    resolveEchoCombat(player, [echo], camera);

    expect(player.hp).toBe(2);
  });
});

describe('resolveEnemyEchoCombat', () => {
  it("damages and knocks back an enemy caught in an echo's attack arc", () => {
    const echo = makeAttackingEcho({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 40, y: 0 });
    const camera = new Camera();

    const events = resolveEnemyEchoCombat([echo], [enemy], camera);

    expect(enemy.hp).toBe(1);
    expect(enemy.body.velocity.x).toBeGreaterThan(0);
    expect(events.hits).toBe(1);
  });

  it('reports a kill when an echo brings the enemy to 0 hp', () => {
    const echo = makeAttackingEcho({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 40, y: 0 });
    enemy.hp = 1;
    const camera = new Camera();

    const events = resolveEnemyEchoCombat([echo], [enemy], camera);

    expect(events.kills).toBe(1);
    expect(enemy.alive).toBe(false);
  });

  it("only damages an enemy once per echo's swing", () => {
    const echo = makeAttackingEcho({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 40, y: 0 });
    const camera = new Camera();

    resolveEnemyEchoCombat([echo], [enemy], camera);
    resolveEnemyEchoCombat([echo], [enemy], camera);

    expect(enemy.hp).toBe(1);
  });

  it('damages an echo on enemy contact when not invulnerable', () => {
    const echo = makeEcho({ x: 0, y: 0 });
    const enemy = new Enemy({ x: 5, y: 0 });
    const camera = new Camera();

    resolveEnemyEchoCombat([echo], [enemy], camera);

    expect(echo.player.hp).toBe(2);
  });

  it('does not damage a dead echo or a dead enemy', () => {
    const echo = makeAttackingEcho({ x: 0, y: 0 });
    echo.player.hp = 0;
    const enemy = new Enemy({ x: 40, y: 0 });
    enemy.alive = false;
    const camera = new Camera();

    const events = resolveEnemyEchoCombat([echo], [enemy], camera);

    expect(events.hits).toBe(0);
    expect(enemy.hp).toBe(CHASER_MAX_HP);
  });
});

describe('resolveEchoVsEchoCombat', () => {
  it("damages and knocks back another echo caught in an attacking echo's arc", () => {
    const attacker = makeAttackingEcho({ x: 0, y: 0 });
    const target = makeEcho({ x: 40, y: 0 });
    const camera = new Camera();

    const events = resolveEchoVsEchoCombat([attacker, target], camera);

    expect(target.player.hp).toBe(2);
    expect(target.player.body.velocity.x).toBeGreaterThan(0);
    expect(events.hits).toBe(1);
  });

  it('reports a kill when one echo brings another to 0 hp', () => {
    const attacker = makeAttackingEcho({ x: 0, y: 0 });
    const target = makeEcho({ x: 40, y: 0 });
    target.player.hp = 1;
    const camera = new Camera();

    const events = resolveEchoVsEchoCombat([attacker, target], camera);

    expect(events.kills).toBe(1);
    expect(target.alive).toBe(false);
  });

  it('never lets an echo hit itself', () => {
    const attacker = makeAttackingEcho({ x: 0, y: 0 });
    const camera = new Camera();

    const events = resolveEchoVsEchoCombat([attacker], camera);

    expect(events.hits).toBe(0);
    expect(attacker.player.hp).toBe(3);
  });

  it("only damages a target once per attacker's swing", () => {
    const attacker = makeAttackingEcho({ x: 0, y: 0 });
    const target = makeEcho({ x: 40, y: 0 });
    const camera = new Camera();

    resolveEchoVsEchoCombat([attacker, target], camera);
    resolveEchoVsEchoCombat([attacker, target], camera);

    expect(target.player.hp).toBe(2);
  });

  it('does not damage a dead target', () => {
    const attacker = makeAttackingEcho({ x: 0, y: 0 });
    const target = makeEcho({ x: 40, y: 0 });
    target.player.hp = 0;
    const camera = new Camera();

    const events = resolveEchoVsEchoCombat([attacker, target], camera);

    expect(events.hits).toBe(0);
  });
});
