import { GameLoop } from './core/GameLoop';
import { createRunSeed, Random } from './core/Random';
import { GameCanvas } from './rendering/Canvas';
import { Camera } from './rendering/Camera';
import { renderPlayer } from './rendering/PlayerRenderer';
import { renderEnemy } from './rendering/EnemyRenderer';
import { renderHud } from './ui/HUD';
import { InputManager } from './input/InputManager';
import { Player } from './entities/Player';
import type { Enemy } from './entities/Enemy';
import { resolveBoundsCollision } from './physics/Collision';
import { resolveCombat } from './systems/CombatSystem';
import { createDefaultArena } from './world/Arena';
import { spawnEnemyAtEdge } from './world/Spawning';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const canvas = new GameCanvas(app);

const input = new InputManager();
input.attach(canvas.element);

const rng = new Random(createRunSeed());
const arena = createDefaultArena();
const player = new Player({ x: 0, y: 0 });
const camera = new Camera();

let enemies: Enemy[] = [spawnEnemyAtEdge(arena, rng)];
let enemyRespawnTimer = 0;
const ENEMY_RESPAWN_DELAY = 1.2;

let playerRespawnTimer = 0;
const PLAYER_RESPAWN_DELAY = 1.5;

function update(dt: number): void {
  const moveAxis = input.getMoveAxis();
  const actions = {
    dash: input.consumeDash(),
    attack: input.consumeAttack(),
    dashDirectionHint: input.getTouchDashDirection(),
  };

  const wasAlive = !player.isDead;

  if (player.isDead) {
    playerRespawnTimer -= dt;
    if (playerRespawnTimer <= 0) {
      player.reset({ x: 0, y: 0 });
    }
  } else {
    player.update(dt, moveAxis, actions);
    resolveBoundsCollision(player.body, arena);
  }

  for (const enemy of enemies) {
    enemy.update(dt, player.body.position);
    if (enemy.alive) resolveBoundsCollision(enemy.body, arena);
  }

  resolveCombat(player, enemies, camera);

  if (wasAlive && player.isDead) {
    // Clear the field so the player doesn't respawn on top of a lurking
    // enemy — full death/results flow lands in Phase 8.
    enemies = [];
    playerRespawnTimer = PLAYER_RESPAWN_DELAY;
  }

  const before = enemies.length;
  enemies = enemies.filter((e) => e.alive);
  if (enemies.length < before) enemyRespawnTimer = ENEMY_RESPAWN_DELAY;
  if (enemies.length === 0) {
    enemyRespawnTimer -= dt;
    if (enemyRespawnTimer <= 0) {
      enemies.push(spawnEnemyAtEdge(arena, rng));
    }
  }
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
  for (const enemy of enemies) renderEnemy(ctx, enemy, offset);
  if (!player.isDead) renderPlayer(ctx, player, offset);

  renderHud(ctx, player);

  ctx.fillStyle = '#666';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${fps} fps`, 12, height - 14);
}

const loop = new GameLoop(update, render);
loop.start();
