import type { TrailPoint } from './Trail';
import type { Vector2 } from '../core/Vector2';

/** Draws a fading afterimage trail — each point shrinks and fades with age. */
export function renderTrail(
  ctx: CanvasRenderingContext2D,
  points: readonly TrailPoint[],
  radius: number,
  color: string,
  offset: Vector2,
): void {
  ctx.save();
  for (const point of points) {
    ctx.globalAlpha = point.alpha * 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      point.position.x + offset.x,
      point.position.y + offset.y,
      radius * (0.5 + 0.5 * point.alpha),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
