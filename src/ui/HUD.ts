import type { Player } from '../entities/Player';
import { PLAYER_MAX_HP } from '../entities/Player';
import type { FlowSystem } from '../systems/FlowSystem';
import { FLOW_MAX } from '../systems/FlowSystem';
import type { ScoreSystem } from '../systems/ScoreSystem';

const PIP_RADIUS = 7;
const PIP_GAP = 22;
const MARGIN = 24;

const FLOW_BAR_WIDTH = 160;
const FLOW_BAR_HEIGHT = 6;
const FLOW_TIER_COLOR: Record<string, string> = {
  LOW: '#666',
  MEDIUM: '#4da6ff',
  HIGH: '#ffb347',
  MAX: '#ff5c5c',
};

/** Minimal HUD — HP pips, a Flow bar with multiplier, and score. Restrained
 * UI per PRD §20/§21, no chrome beyond what's needed to read the state. */
export function renderHud(
  ctx: CanvasRenderingContext2D,
  player: Player,
  flow: FlowSystem,
  score: ScoreSystem,
): void {
  ctx.save();

  for (let i = 0; i < PLAYER_MAX_HP; i++) {
    const cx = MARGIN + i * PIP_GAP + PIP_RADIUS;
    const cy = MARGIN;
    ctx.beginPath();
    ctx.arc(cx, cy, PIP_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = i < player.hp ? '#f2f2f2' : 'rgba(255,255,255,0.15)';
    ctx.fill();
  }

  const barY = MARGIN + 26;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(MARGIN, barY, FLOW_BAR_WIDTH, FLOW_BAR_HEIGHT);
  ctx.fillStyle = FLOW_TIER_COLOR[flow.tier];
  ctx.fillRect(MARGIN, barY, FLOW_BAR_WIDTH * (flow.value / FLOW_MAX), FLOW_BAR_HEIGHT);

  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillStyle = FLOW_TIER_COLOR[flow.tier];
  ctx.textAlign = 'left';
  ctx.fillText(`FLOW x${flow.multiplier}`, MARGIN + FLOW_BAR_WIDTH + 10, barY + FLOW_BAR_HEIGHT);

  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillStyle = '#ccc';
  ctx.fillText(`${score.rounded.toLocaleString()}`, MARGIN, barY + 26);

  ctx.restore();
}
