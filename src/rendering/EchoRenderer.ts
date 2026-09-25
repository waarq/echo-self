import type { Echo } from '../entities/Echo';
import type { Vector2 } from '../core/Vector2';
import { renderPlayer } from './PlayerRenderer';

const ECHO_OPACITY = 0.75;

/** Draws an Echo at reduced opacity so the live player always reads as "the
 * real one" (PRD §18). Reuses PlayerRenderer directly — an Echo is a Player
 * under the hood, so it should look like one, just faded. */
export function renderEcho(ctx: CanvasRenderingContext2D, echo: Echo, offset: Vector2): void {
  if (!echo.alive) return;
  ctx.save();
  ctx.globalAlpha = ECHO_OPACITY;
  renderPlayer(ctx, echo.player, offset);
  ctx.restore();
}
