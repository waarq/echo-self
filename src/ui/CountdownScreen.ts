/** COUNTDOWN overlay drawn over the frozen arena (PRD §24). `remainingSec`
 * counts down to zero; once it reaches zero this frame shows "GO" for the
 * caller's last render before transitioning to PLAYING. */
export function renderCountdown(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  remainingSec: number,
): void {
  const label = remainingSec > 0 ? String(Math.ceil(remainingSec)) : 'GO';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '700 72px system-ui, sans-serif';
  ctx.fillText(label, width / 2, height / 2);
  ctx.restore();
}
