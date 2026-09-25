import type { Vector2 } from '../core/Vector2';
import { normalize, scale } from '../core/Vector2';
import type { Player } from '../entities/Player';
import { CHASER_CONTACT_KNOCKBACK, CHASER_TOUCH_DAMAGE, Enemy } from '../entities/Enemy';
import { circlesOverlap } from '../physics/Collision';
import { playSfx } from '../audio/SFX';
import type { Camera } from '../rendering/Camera';

const ATTACK_KNOCKBACK = 480;

export interface CombatEvents {
  hits: number;
  kills: number;
  perfectDodges: number;
  playerHit: boolean;
}

function emptyEvents(): CombatEvents {
  return { hits: 0, kills: 0, perfectDodges: 0, playerHit: false };
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
export function resolveCombat(player: Player, enemies: Enemy[], camera: Camera): CombatEvents {
  const events = emptyEvents();

  if (player.isAttacking) {
    const hitbox = player.getAttackHitbox();
    for (const enemy of enemies) {
      if (!enemy.alive || player.hitTargetsThisSwing.has(enemy.id)) continue;
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
        player.hitTargetsThisSwing.add(enemy.id);
        enemy.takeDamage(1);
        events.hits += 1;
        if (!enemy.alive) events.kills += 1;
        const away = normalize({
          x: enemy.body.position.x - hitbox.origin.x,
          y: enemy.body.position.y - hitbox.origin.y,
        });
        enemy.body.velocity = scale(away, ATTACK_KNOCKBACK);
        playSfx('hit');
        camera.shake(4, 0.08);
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
        break;
      }
    }
  }

  return events;
}
