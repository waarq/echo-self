import { FIXED_DT } from './core/Time';
import { GameLoop } from './core/GameLoop';
import { createRunSeed, Random } from './core/Random';
import { GameCanvas } from './rendering/Canvas';
import { Camera } from './rendering/Camera';
import { renderPlayer } from './rendering/PlayerRenderer';
import { renderEnemy } from './rendering/EnemyRenderer';
import { renderEcho } from './rendering/EchoRenderer';
import { renderHud } from './ui/HUD';
import { InputManager } from './input/InputManager';
import { Player } from './entities/Player';
import type { Enemy } from './entities/Enemy';
import { Echo } from './entities/Echo';
import { resolveBoundsCollision } from './physics/Collision';
import {
  resolveCombat,
  resolveEchoCombat,
  resolveEnemyEchoCombat,
  resolveEchoVsEchoCombat,
} from './systems/CombatSystem';
import {
  FLOW_GAIN_ECHO_KILL,
  FLOW_GAIN_HIT,
  FLOW_GAIN_KILL,
  FLOW_GAIN_PERFECT_DODGE,
  FlowSystem,
} from './systems/FlowSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { EchoRecorder } from './systems/EchoSystem';
import { applyHazardDamage, resolveArenaObstacles } from './systems/ArenaSystem';
import { generateArena } from './world/ArenaGenerator';
import { spawnEnemyAtSpawnPoint } from './world/Spawning';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const canvas = new GameCanvas(app);

const input = new InputManager();
input.attach(canvas.element);

const rng = new Random(createRunSeed());
// Fixed starting complexity for now — Phase 7's DifficultyDirector is the
// intended future caller of generateArena's complexity parameter.
const STARTING_ARENA_COMPLEXITY = 2;
const arena = generateArena(rng, STARTING_ARENA_COMPLEXITY);
const player = new Player({ x: 0, y: 0 });
const camera = new Camera();
const flow = new FlowSystem();
const score = new ScoreSystem();

const SANDBOX_ENEMY_COUNT = 2;
let enemies: Enemy[] = Array.from({ length: SANDBOX_ENEMY_COUNT }, () =>
  spawnEnemyAtSpawnPoint(arena, rng),
);
let enemyRespawnTimer = 0;
const ENEMY_RESPAWN_DELAY = 1.2;

let playerRespawnTimer = 0;
const PLAYER_RESPAWN_DELAY = 1.5;

let echoRecorder = new EchoRecorder();
let echoes: Echo[] = [];
let echoDetectedTimer = 0;
const ECHO_DETECTED_MESSAGE_SEC = 2.5;

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
    resolveBoundsCollision(player.body, arena.bounds);
    resolveArenaObstacles(player.body, arena);
    applyHazardDamage(player, arena.hazards);
  }

  if (!player.isDead) {
    // Keep recording sequential 15s windows for as long as the player is
    // alive, so multiple Echoes accumulate over a run (PRD §6) rather than
    // capping at the single Echo Phase 4 needed to prove playback worked.
    echoRecorder.record(player.body.position, moveAxis, actions);
    if (echoRecorder.isFull(FIXED_DT)) {
      echoes.push(new Echo(echoRecorder.finalize()));
      echoRecorder = new EchoRecorder();
      echoDetectedTimer = ECHO_DETECTED_MESSAGE_SEC;
    }
  }

  for (const enemy of enemies) {
    enemy.update(dt, player.body.position);
    if (enemy.alive) {
      resolveBoundsCollision(enemy.body, arena.bounds);
      resolveArenaObstacles(enemy.body, arena);
      applyHazardDamage(enemy, arena.hazards);
    }
  }

  for (const echo of echoes) {
    echo.update(dt);
    if (echo.alive) {
      resolveBoundsCollision(echo.player.body, arena.bounds);
      resolveArenaObstacles(echo.player.body, arena);
      applyHazardDamage(echo.player, arena.hazards);
    }
  }

  echoDetectedTimer = Math.max(0, echoDetectedTimer - dt);

  const events = resolveCombat(player, enemies, camera);
  const echoEvents = resolveEchoCombat(player, echoes, camera);
  resolveEnemyEchoCombat(echoes, enemies, camera);
  resolveEchoVsEchoCombat(echoes, camera);

  flow.update(dt);
  if (events.hits > 0) flow.add(FLOW_GAIN_HIT * events.hits);
  if (events.kills > 0) flow.add(FLOW_GAIN_KILL * events.kills);
  if (events.perfectDodges > 0) flow.add(FLOW_GAIN_PERFECT_DODGE * events.perfectDodges);
  if (events.playerHit) flow.onDamageTaken();
  if (echoEvents.kills > 0) flow.add(FLOW_GAIN_ECHO_KILL * echoEvents.kills);
  if (echoEvents.playerHit) flow.onDamageTaken();

  if (!player.isDead) score.addSurvivalTime(dt, flow.multiplier);
  for (let i = 0; i < events.kills; i++) score.addEnemyKill(flow.multiplier);
  for (let i = 0; i < events.perfectDodges; i++) score.addPerfectDodge(flow.multiplier);
  for (let i = 0; i < echoEvents.kills; i++) score.addEchoKill(flow.multiplier);

  echoes = echoes.filter((e) => e.alive);

  if (wasAlive && player.isDead) {
    // Clear the field so the player doesn't respawn on top of a lurking
    // enemy — full death/results flow lands in Phase 8.
    enemies = [];
    playerRespawnTimer = PLAYER_RESPAWN_DELAY;
    flow.value = 0;
  }

  const before = enemies.length;
  enemies = enemies.filter((e) => e.alive);
  if (enemies.length < before) enemyRespawnTimer = ENEMY_RESPAWN_DELAY;
  if (enemies.length < SANDBOX_ENEMY_COUNT) {
    enemyRespawnTimer -= dt;
    if (enemyRespawnTimer <= 0) {
      enemies.push(spawnEnemyAtSpawnPoint(arena, rng));
      enemyRespawnTimer = ENEMY_RESPAWN_DELAY;
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
    arena.bounds.minX + offset.x,
    arena.bounds.minY + offset.y,
    arena.bounds.maxX - arena.bounds.minX,
    arena.bounds.maxY - arena.bounds.minY,
  );

  ctx.fillStyle = '#2a2a2a';
  ctx.strokeStyle = '#444';
  for (const obstacle of arena.obstacles) {
    const x = obstacle.minX + offset.x;
    const y = obstacle.minY + offset.y;
    const w = obstacle.maxX - obstacle.minX;
    const h = obstacle.maxY - obstacle.minY;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  ctx.fillStyle = 'rgba(200, 40, 40, 0.25)';
  ctx.strokeStyle = 'rgba(200, 40, 40, 0.6)';
  for (const hazard of arena.hazards) {
    const x = hazard.minX + offset.x;
    const y = hazard.minY + offset.y;
    const w = hazard.maxX - hazard.minX;
    const h = hazard.maxY - hazard.minY;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
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
  for (const echo of echoes) renderEcho(ctx, echo, offset);
  if (!player.isDead) renderPlayer(ctx, player, offset);

  renderHud(ctx, player, flow, score);

  if (echoDetectedTimer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, echoDetectedTimer);
    ctx.fillStyle = '#e8e8e8';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ECHO DETECTED', width / 2, 64);
    ctx.restore();
  }

  ctx.fillStyle = '#666';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${fps} fps`, 12, height - 14);
}

const loop = new GameLoop(update, render);
loop.start();
