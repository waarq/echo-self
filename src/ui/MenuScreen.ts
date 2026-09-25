/** Title screen (PRD §24's MENU state). Deliberately minimal — a title and
 * a single "press anything to start" prompt, no menu chrome, per PRD §21's
 * restrained-UI direction. */
export function renderMenu(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#e8e8e8';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText('ECHO // SELF', width / 2, height / 2 - 16);

  ctx.fillStyle = '#999';
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('press space, click, or tap to start', width / 2, height / 2 + 24);

  ctx.restore();
}
