import type { Vector2 } from '../core/Vector2';
import { normalize, scale } from '../core/Vector2';
import type { Player } from '../entities/Player';
import { CHASER_CONTACT_KNOCKBACK, CHASER_TOUCH_DAMAGE, Enemy } from '../entities/Enemy';
import type { Echo } from '../entities/Echo';
import { circlesOverlap } from '../physics/Collision';
import { playSfx } from '../audio/SFX';
import type { Camera } from '../rendering/Camera';
import type { ParticleSystem } from './ParticleSystem';
import type { HitStopController } from './HitStop';

const ATTACK_KNOCKBACK = 480;
const PLAYER_TARGET_KEY = 'player';

// Juice tuning (PRD §10, §21: impact frames and particle bursts, kept brief
// and restrained per §19's "controlled particle effects" — not on every
// plain hit, only the moments meant to read as impactful).
const HIT_SPARK = { count: 6, speed: 140, lifetime: 0.2, radius: 2.5, color: '#e8e8e8' };
const KILL_BURST = { count: 12, speed: 180, lifetime: 0.35, radius: 3, color: '#e8e8e8' };
const PERFECT_DODGE_BURST = { count: 10, speed: 160, lifetime: 0.3, radius: 2.5, color: '#4da6ff' };
const PLAYER_HIT_BURST = { count: 10, speed: 150, lifetime: 0.3, radius: 3, color: '#ff5c5c' };

const KILL_HITSTOP_SEC = 0.05;
const PERFECT_DODGE_HITSTOP_SEC = 0.07;
const PLAYER_HIT_HITSTOP_SEC = 0.06;

export interface CombatEvents {
  hits: number;
  kills: number;
  perfectDodges: number;
  playerHit: boolean;
}

function emptyEvents(): CombatEvents {
  return { hits: 0, kills: 0, perfectDodges: 0, playerHit: false };
}

/** Outcome of a purely emergent interaction the live player had no direct
 * part in (Echo vs enemy, Echo vs Echo) — no `playerHit`/`perfectDodges`
 * since those are player-only concepts, and deliberately not fed into the
 * player's Flow/Score (PRD §7: this is the player's past becoming a tool in
 * the world, not a scoring event for the player). */
export interface InteractionEvents {
  hits: number;
  kills: number;
}

function emptyInteractionEvents(): InteractionEvents {
  return { hits: 0, kills: 0 };
}

/** Smallest signed difference between two angles, in [-PI, PI]. Pure so the
 * arc-hit test is unit-testable without constructing entities. */
export function angleDiff(a: number, b: number): number {
  let diff = (a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function isInAttackArc(
  origin: Vector2,
  targetPos: Vector2,
  targetRadius: number,
  facing: number,
  range: number,
  arc: number,
): boolean {
  const dx = targetPos.x - origin.x;
  const dy = targetPos.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range + targetRadius) return false;
  const angleToTarget = Math.atan2(dy, dx);
  return Math.abs(angleDiff(angleToTarget, facing)) <= arc / 2;
}

/** Applies the player's active attack hitbox to enemies, enemy-contact
 * damage to the player, and detects "perfect dodge" (dashing through an
 * enemy's hit radius while the dash's i-frames absorb what would otherwise
 * be damage — PRD §10). Returns a summary of what happened this frame so
 * Flow/Score can react without this module depending on them (PRD §11, §17). */
export function resolveCombat(
  player: Player,
  enemies: Enemy[],
  camera: Camera,
  particles?: ParticleSystem,
  hitStop?: HitStopController,
): CombatEvents {
  const events = emptyEvents();

  if (player.isAttacking) {
    const hitbox = player.getAttackHitbox();
    for (const enemy of enemies) {
      const key = `enemy:${enemy.id}`;
      if (!enemy.alive || player.hitTargetsThisSwing.has(key)) continue;
      if (
        isInAttackArc(
          hitbox.origin,
          enemy.body.position,
          enemy.body.radius,
          hitbox.facing,
          hitbox.range,
          hitbox.arc,
        )
      ) {
        player.hitTargetsThisSwing.add(key);
        enemy.takeDamage(1);
        events.hits += 1;
        const killed = !enemy.alive;
        if (killed) events.kills += 1;
        const away = normalize({
          x: enemy.body.position.x - hitbox.origin.x,
          y: enemy.body.position.y - hitbox.origin.y,
        });
        enemy.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('hit');
        camera.shake(4, 0.08);
        if (killed) {
          particles?.spawnBurst(enemy.body.position, KILL_BURST);
          hitStop?.trigger(KILL_HITSTOP_SEC);
        } else {
          particles?.spawnBurst(enemy.body.position, HIT_SPARK);
        }
      }
    }
  }

  if (player.isDashing && !player.perfectDodgeAwardedThisDash) {
    for (const enemy of enemies) {
      if (enemy.alive && circlesOverlap(player.body, enemy.body)) {
        player.perfectDodgeAwardedThisDash = true;
        events.perfectDodges += 1;
        playSfx('perfectDodge');
        camera.shake(3, 0.1);
        particles?.spawnBurst(player.body.position, PERFECT_DODGE_BURST);
        hitStop?.trigger(PERFECT_DODGE_HITSTOP_SEC);
        break;
      }
    }
  }

  if (!player.isInvulnerable && !player.isDead) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (circlesOverlap(player.body, enemy.body)) {
        player.takeDamage(CHASER_TOUCH_DAMAGE);
        events.playerHit = true;
        const away = normalize({
          x: player.body.position.x - enemy.body.position.x,
          y: player.body.position.y - enemy.body.position.y,
        });
        player.body.velocity = scale(away, CHASER_CONTACT_KNOCKBACK);
        playSfx('playerDamage');
        camera.shake(8, 0.15);
        particles?.spawnBurst(player.body.position, PLAYER_HIT_BURST);
        hitStop?.trigger(PLAYER_HIT_HITSTOP_SEC);
        break;
      }
    }
  }

  return events;
}

/** Echo vs. player combat: unlike a Chaser's contact damage, an Echo has the
 * player's own kit — it only damages the live player through its (recorded)
 * arc attack, and the live player's attack can kill it the same way it kills
 * an enemy (PRD §4, §18: an Echo is the player, not a weaker imitation). */
export function resolveEchoCombat(
  player: Player,
  echoes: Echo[],
  camera: Camera,
  particles?: ParticleSystem,
  hitStop?: HitStopController,
): CombatEvents {
  const events = emptyEvents();

  if (player.isAttacking) {
    const hitbox = player.getAttackHitbox();
    for (const echo of echoes) {
      const key = `echo:${echo.id}`;
      if (!echo.alive || player.hitTargetsThisSwing.has(key)) continue;
      if (
        isInAttackArc(
          hitbox.origin,
          echo.player.body.position,
          echo.player.body.radius,
          hitbox.facing,
          hitbox.range,
          hitbox.arc,
        )
      ) {
        player.hitTargetsThisSwing.add(key);
        echo.player.takeDamage(1);
        events.hits += 1;
        const killed = !echo.alive;
        if (killed) events.kills += 1;
        const away = normalize({
          x: echo.player.body.position.x - hitbox.origin.x,
          y: echo.player.body.position.y - hitbox.origin.y,
        });
        echo.player.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('hit');
        camera.shake(4, 0.08);
        if (killed) {
          particles?.spawnBurst(echo.player.body.position, KILL_BURST);
          hitStop?.trigger(KILL_HITSTOP_SEC);
        } else {
          particles?.spawnBurst(echo.player.body.position, HIT_SPARK);
        }
      }
    }
  }

  if (!player.isInvulnerable && !player.isDead) {
    for (const echo of echoes) {
      if (!echo.alive || !echo.player.isAttacking) continue;
      if (echo.player.hitTargetsThisSwing.has(PLAYER_TARGET_KEY)) continue;
      const hitbox = echo.player.getAttackHitbox();
      if (
        isInAttackArc(
          hitbox.origin,
          player.body.position,
          player.body.radius,
          hitbox.facing,
          hitbox.range,
          hitbox.arc,
        )
      ) {
        echo.player.hitTargetsThisSwing.add(PLAYER_TARGET_KEY);
        player.takeDamage(1);
        events.playerHit = true;
        const away = normalize({
          x: player.body.position.x - hitbox.origin.x,
          y: player.body.position.y - hitbox.origin.y,
        });
        player.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('playerDamage');
        camera.shake(8, 0.15);
        particles?.spawnBurst(player.body.position, PLAYER_HIT_BURST);
        hitStop?.trigger(PLAYER_HIT_HITSTOP_SEC);
        break;
      }
    }
  }

  return events;
}

/** Echo vs. enemy (PRD §7, Phase 5): an Echo's recorded attack can kill an
 * enemy exactly like the live player's can, and an enemy's contact damage
 * hurts an Echo exactly like it hurts the live player. Neither side gets
 * Flow/Score for it — this is the world reacting to the player's own past,
 * not the player's own performance. */
export function resolveEnemyEchoCombat(
  echoes: Echo[],
  enemies: Enemy[],
  camera: Camera,
  particles?: ParticleSystem,
): InteractionEvents {
  const events = emptyInteractionEvents();

  for (const echo of echoes) {
    if (!echo.alive || !echo.player.isAttacking) continue;
    const hitbox = echo.player.getAttackHitbox();
    for (const enemy of enemies) {
      const key = `enemy:${enemy.id}`;
      if (!enemy.alive || echo.player.hitTargetsThisSwing.has(key)) continue;
      if (
        isInAttackArc(
          hitbox.origin,
          enemy.body.position,
          enemy.body.radius,
          hitbox.facing,
          hitbox.range,
          hitbox.arc,
        )
      ) {
        echo.player.hitTargetsThisSwing.add(key);
        enemy.takeDamage(1);
        events.hits += 1;
        const killed = !enemy.alive;
        if (killed) events.kills += 1;
        const away = normalize({
          x: enemy.body.position.x - hitbox.origin.x,
          y: enemy.body.position.y - hitbox.origin.y,
        });
        enemy.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('hit');
        camera.shake(3, 0.06);
        particles?.spawnBurst(enemy.body.position, killed ? KILL_BURST : HIT_SPARK);
      }
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    for (const echo of echoes) {
      if (!echo.alive || echo.player.isInvulnerable) continue;
      if (circlesOverlap(echo.player.body, enemy.body)) {
        echo.player.takeDamage(CHASER_TOUCH_DAMAGE);
        const away = normalize({
          x: echo.player.body.position.x - enemy.body.position.x,
          y: echo.player.body.position.y - enemy.body.position.y,
        });
        echo.player.body.velocity = scale(away, CHASER_CONTACT_KNOCKBACK);
        playSfx('hit');
        camera.shake(3, 0.06);
        particles?.spawnBurst(echo.player.body.position, HIT_SPARK);
        break;
      }
    }
  }

  return events;
}

/** Echo vs. Echo (PRD §6, §7, Phase 5): once multiple Echoes are alive at
 * once, each one's recorded attack can land on any other Echo, the same way
 * it lands on the live player or an enemy. Mirrors resolveEchoCombat's
 * "attack only, no contact damage" rule — an Echo is the player, and the
 * player never takes contact damage from another player. */
export function resolveEchoVsEchoCombat(
  echoes: Echo[],
  camera: Camera,
  particles?: ParticleSystem,
): InteractionEvents {
  const events = emptyInteractionEvents();

  for (const attacker of echoes) {
    if (!attacker.alive || !attacker.player.isAttacking) continue;
    const hitbox = attacker.player.getAttackHitbox();
    for (const target of echoes) {
      if (target === attacker) continue;
      const key = `echo:${target.id}`;
      if (!target.alive || attacker.player.hitTargetsThisSwing.has(key)) continue;
      if (
        isInAttackArc(
          hitbox.origin,
          target.player.body.position,
          target.player.body.radius,
          hitbox.facing,
          hitbox.range,
          hitbox.arc,
        )
      ) {
        attacker.player.hitTargetsThisSwing.add(key);
        target.player.takeDamage(1);
        events.hits += 1;
        const killed = !target.alive;
        if (killed) events.kills += 1;
        const away = normalize({
          x: target.player.body.position.x - hitbox.origin.x,
          y: target.player.body.position.y - hitbox.origin.y,
        });
        target.player.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('hit');
        camera.shake(3, 0.06);
        particles?.spawnBurst(target.player.body.position, killed ? KILL_BURST : HIT_SPARK);
      }
    }
  }

  return events;
}
