import type { Echo } from '../entities/Echo';
import type { Vector2 } from '../core/Vector2';
import { renderPlayer } from './PlayerRenderer';

// PRD §18's example table (PLAYER 100%, ECHO-01 80%, ECHO-02 65%, ECHO-03
// 50%): each additional Echo on screen reads as progressively "older"/more
// ghostly, capped at a floor so it never becomes impossible to see.
const ECHO_OPACITY_STEPS = [0.8, 0.65, 0.5];
const ECHO_OPACITY_FLOOR = 0.4;

/** Pure: opacity for the Echo at `index` within the currently active Echoes
 * list (0 = oldest surviving Echo). */
export function opacityForEchoIndex(index: number): number {
  return ECHO_OPACITY_STEPS[index] ?? ECHO_OPACITY_FLOOR;
}

/** Draws an Echo at reduced, index-dependent opacity so the live player
 * always reads as "the real one" and stays visually dominant even as more
 * Echoes accumulate (PRD §18). Reuses PlayerRenderer directly — an Echo is a
 * Player under the hood, so it should look like one, just faded. */
export function renderEcho(
  ctx: CanvasRenderingContext2D,
  echo: Echo,
  offset: Vector2,
  index: number,
): void {
  if (!echo.alive) return;
  ctx.save();
  ctx.globalAlpha = opacityForEchoIndex(index);
  renderPlayer(ctx, echo.player, offset);
  ctx.restore();
}
