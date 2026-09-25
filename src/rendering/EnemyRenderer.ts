import type { Enemy } from '../entities/Enemy';
import type { Vector2 } from '../core/Vector2';

const DANGER_COLOR = '#e6453c';
const HIT_FLASH_COLOR = '#ffffff';

/** Draws an enemy with the restrained "danger accent" color (PRD §20), with
 * a brief white flash on hit for impact feedback. */
export function renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, offset: Vector2): void {
  if (!enemy.alive) return;
  const { position, radius } = enemy.body;
  const x = position.x + offset.x;
  const y = position.y + offset.y;

  ctx.save();
  ctx.fillStyle = enemy.hitFlashTimer > 0 ? HIT_FLASH_COLOR : DANGER_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
