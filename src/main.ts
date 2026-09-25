import { GameLoop } from './core/GameLoop';
import { GameCanvas } from './rendering/Canvas';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const canvas = new GameCanvas(app);

const loop = new GameLoop(
  (_dt) => {
    // Phase 0: no gameplay yet. Update runs to prove the fixed-timestep
    // loop is alive; gameplay systems attach here in later phases.
  },
  (_alpha, fps) => {
    const { ctx, width, height } = canvas;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e8e8e8';
    ctx.font = '600 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ECHO//SELF', width / 2, height / 2);

    ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(`${fps} fps`, width / 2, height / 2 + 28);
  },
);

loop.start();
