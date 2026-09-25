import { GameLoop } from './core/GameLoop';
import { GameCanvas } from './rendering/Canvas';
import { Camera } from './rendering/Camera';
import { renderPlayer } from './rendering/PlayerRenderer';
import { InputManager } from './input/InputManager';
import { Player } from './entities/Player';
import { resolveBoundsCollision } from './physics/Collision';
import { createDefaultArena } from './world/Arena';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const canvas = new GameCanvas(app);

const input = new InputManager();
input.attach(canvas.element);

const arena = createDefaultArena();
const player = new Player({ x: 0, y: 0 });
const camera = new Camera();

function update(dt: number): void {
  const moveAxis = input.getMoveAxis();
  player.update(dt, moveAxis);
  resolveBoundsCollision(player.body, arena);
}

function drawGrid(ctx: CanvasRenderingContext2D, offset: { x: number; y: number }): void {
  const spacing = 80;
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  const startX = ((offset.x % spacing) + spacing) % spacing;
  const startY = ((offset.y % spacing) + spacing) % spacing;
  ctx.beginPath();
  for (let x = startX; x < canvas.width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = startY; y < canvas.height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawArenaBounds(ctx: CanvasRenderingContext2D, offset: { x: number; y: number }): void {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    arena.minX + offset.x,
    arena.minY + offset.y,
    arena.maxX - arena.minX,
    arena.maxY - arena.minY,
  );
}

let lastRenderTime = performance.now();

function render(_alpha: number, fps: number): void {
  const now = performance.now();
  const renderDt = Math.min((now - lastRenderTime) / 1000, 0.1);
  lastRenderTime = now;

  camera.follow(player.body.position, renderDt);
  const offset = camera.getOffset(canvas.width, canvas.height, renderDt);

  const { ctx, width, height } = canvas;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, offset);
  drawArenaBounds(ctx, offset);
  renderPlayer(ctx, player, offset);

  ctx.fillStyle = '#666';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${fps} fps`, 12, 20);
}

const loop = new GameLoop(update, render);
loop.start();
