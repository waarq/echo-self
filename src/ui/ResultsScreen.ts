export interface RunSummary {
  survivalTimeSec: number;
  score: number;
  echoesCreated: number;
  perfectDodges: number;
  maxFlowMultiplier: number;
}

/** Pure: mm:ss for the RESULTS screen's SURVIVAL line (PRD §27's "04:37"). */
export function formatSurvivalTime(totalSec: number): string {
  const whole = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** RUN RECORDED summary screen (PRD §27) with a prominent restart prompt —
 * the whole screen doubles as the "AGAIN" button since input.consumeConfirm
 * accepts any click/tap/keypress, so there's nothing to miss-click. */
export function renderResults(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  summary: RunSummary,
): void {
  ctx.save();
  ctx.textAlign = 'center';

  const centerX = width / 2;
  let y = height / 2 - 140;

  ctx.fillStyle = '#999';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('RUN RECORDED', centerX, y);
  y += 48;

  ctx.fillStyle = '#e8e8e8';
  ctx.font = '700 40px system-ui, sans-serif';
  ctx.fillText(formatSurvivalTime(summary.survivalTimeSec), centerX, y);
  ctx.fillStyle = '#777';
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillText('SURVIVAL', centerX, y + 18);
  y += 56;

  ctx.fillStyle = '#e8e8e8';
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.fillText(Math.floor(summary.score).toLocaleString(), centerX, y);
  ctx.fillStyle = '#777';
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillText('SCORE', centerX, y + 18);
  y += 48;

  const stats: Array<[string, string]> = [
    ['ECHOES CREATED', String(summary.echoesCreated)],
    ['PERFECT DODGES', String(summary.perfectDodges)],
    ['MAX FLOW', `x${summary.maxFlowMultiplier}`],
  ];
  ctx.font = '400 15px system-ui, sans-serif';
  for (const [label, value] of stats) {
    ctx.fillStyle = '#777';
    ctx.textAlign = 'right';
    ctx.fillText(label, centerX - 8, y);
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'left';
    ctx.fillText(value, centerX + 8, y);
    y += 24;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8e8e8';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillText('AGAIN', centerX, y + 36);
  ctx.fillStyle = '#999';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText('press space, click, or tap', centerX, y + 58);

  ctx.restore();
}
