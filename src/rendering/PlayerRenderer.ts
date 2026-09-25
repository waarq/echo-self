import type { Player } from '../entities/Player';
import type { Vector2 } from '../core/Vector2';

const BODY_COLOR = '#f2f2f2';
const FACING_COLOR = '#e8e8e8';
const ATTACK_COLOR = 'rgba(232, 232, 232, 0.35)';
const ACCENT_COLOR = '#4da6ff';

/** Draws the player as a high-contrast silhouette with a facing indicator,
 * an attack-arc flash, and an invulnerability flicker. Highest visual
 * clarity of anything on screen — Echoes render at reduced opacity so the
 * player always reads as "the real one" (PRD §18). */
export function renderPlayer(ctx: CanvasRenderingContext2D, player: Player, offset: Vector2): void {
  const { position, radius } = player.body;
  const x = position.x + offset.x;
  const y = position.y + offset.y;

  // Flicker while invulnerable (post-hit or mid-dash) so the state reads
  // clearly without needing a HUD element.
  const flicker = player.isInvulnerable ? Math.sin(performance.now() / 40) > 0 : true;
  if (!flicker) return;

  ctx.save();

  if (player.isAttacking) {
    const hitbox = player.getAttackHitbox();
    ctx.fillStyle = ATTACK_COLOR;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, hitbox.range, hitbox.facing - hitbox.arc / 2, hitbox.facing + hitbox.arc / 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = player.isDashing ? ACCENT_COLOR : BODY_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = FACING_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + Math.cos(player.facing) * (radius + 12),
    y + Math.sin(player.facing) * (radius + 12),
  );
  ctx.stroke();
  ctx.restore();
}
