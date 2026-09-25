import type { Player } from '../entities/Player';
import { PLAYER_MAX_HP } from '../entities/Player';

const PIP_RADIUS = 7;
const PIP_GAP = 22;
const MARGIN = 24;

/** Minimal HP pip row — restrained UI per PRD §20/§21, no health bar chrome. */
export function renderHud(ctx: CanvasRenderingContext2D, player: Player): void {
  ctx.save();
  for (let i = 0; i < PLAYER_MAX_HP; i++) {
    const cx = MARGIN + i * PIP_GAP + PIP_RADIUS;
    const cy = MARGIN;
    ctx.beginPath();
    ctx.arc(cx, cy, PIP_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = i < player.hp ? '#f2f2f2' : 'rgba(255,255,255,0.15)';
    ctx.fill();
  }
  ctx.restore();
}
