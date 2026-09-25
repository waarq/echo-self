import { FIXED_DT } from './core/Time';
import { GameLoop } from './core/GameLoop';
import { GameState, GameStateMachine } from './core/GameState';
import { createRunSeed, Random } from './core/Random';
import { GameCanvas } from './rendering/Canvas';
import { Camera } from './rendering/Camera';
import { renderPlayer } from './rendering/PlayerRenderer';
import { renderEnemy } from './rendering/EnemyRenderer';
import { renderEcho } from './rendering/EchoRenderer';
import { renderParticles } from './rendering/ParticleRenderer';
import { MotionTrail } from './rendering/Trail';
import { renderTrail } from './rendering/TrailRenderer';
import { renderHud } from './ui/HUD';
import { renderMenu } from './ui/MenuScreen';
import { renderCountdown } from './ui/CountdownScreen';
import { renderResults } from './ui/ResultsScreen';
import type { RunSummary } from './ui/ResultsScreen';
import { InputManager } from './input/InputManager';
import { Player, PLAYER_RADIUS } from './entities/Player';
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
import type { FlowTier } from './systems/FlowSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { RunStats } from './systems/RunStats';
import { EchoRecorder } from './systems/EchoSystem';
import { applyHazardDamage, resolveArenaObstacles } from './systems/ArenaSystem';
import { DifficultyDirector } from './systems/DifficultyDirector';
import { HitStopController } from './systems/HitStop';
import { ParticleSystem } from './systems/ParticleSystem';
import { playSfx } from './audio/SFX';
import { MusicDirector } from './audio/Music';
import { createDefaultArena, type Arena } from './world/Arena';
import { generateArena } from './world/ArenaGenerator';
import { spawnEnemyAtSpawnPoint } from './world/Spawning';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const canvas = new GameCanvas(app);

const input = new InputManager();
input.attach(canvas.element);

// Countdown before the very first run gives the player a beat to orient;
// restarting from RESULTS uses a much shorter one so death -> back-in-play
// stays well under the PRD §27 "restart within 2 seconds" target.
const INITIAL_COUNTDOWN_SEC = 3;
const RESTART_COUNTDOWN_SEC = 0.4;
const DEATH_SEQUENCE_SEC = 0.6; // PRD §27: time freeze / impact frame beat before RESULTS
const INITIAL_ENEMY_COUNT = 2;
const ECHO_DETECTED_MESSAGE_SEC = 2.5;
const DASH_TRAIL_LIFETIME_SEC = 0.22;
const PLAYER_DEATH_BURST = { count: 16, speed: 200, lifetime: 0.4, radius: 3, color: '#ff5c5c' };

const FLOW_TIER_RANK: Record<FlowTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, MAX: 3 };

const rng = new Random(createRunSeed());
const gameState = new GameStateMachine();

const player = new Player({ x: 0, y: 0 });
const camera = new Camera();
const flow = new FlowSystem();
const score = new ScoreSystem();
const runStats = new RunStats();
const hitStop = new HitStopController();
const particles = new ParticleSystem();
const playerTrail = new MotionTrail(DASH_TRAIL_LIFETIME_SEC);
const music = new MusicDirector();

let difficulty = new DifficultyDirector();
let arena: Arena = createDefaultArena();
let enemies: Enemy[] = [];
let enemyRespawnTimer = 0;
let echoRecorder = new EchoRecorder();
let echoes: Echo[] = [];
let echoDetectedTimer = 0;
let countdownRemaining = 0;
let deathTimer = 0;
let previousFlowTier: FlowTier = 'LOW';
let flowMaxPlayedThisRun = false;

/** Resets every per-run system to a fresh state and arms the countdown that
 * leads into PLAYING. Shared by the first MENU->COUNTDOWN start and every
 * RESULTS->COUNTDOWN restart, so both paths behave identically. */
function startRun(countdownSec: number): void {
  difficulty = new DifficultyDirector();
  arena = generateArena(rng, difficulty.arenaComplexity);
  player.reset({ x: 0, y: 0 });
  enemies = Array.from({ length: INITIAL_ENEMY_COUNT }, () => spawnEnemyAtSpawnPoint(arena, rng));
  enemyRespawnTimer = 0;
  echoRecorder = new EchoRecorder();
  echoes = [];
  echoDetectedTimer = 0;
  flow.reset();
  score.reset();
  runStats.reset();
  particles.clear();
  playerTrail.clear();
  previousFlowTier = 'LOW';
  flowMaxPlayedThisRun = false;
  countdownRemaining = countdownSec;
  music.start(); // no-op if already running (browsers require the user gesture that got us here)
}

function buildRunSummary(): RunSummary {
  return {
    survivalTimeSec: runStats.survivalTimeSec,
    score: score.rounded,
    echoesCreated: runStats.echoesCreated,
    perfectDodges: runStats.perfectDodges,
    maxFlowMultiplier: runStats.maxFlowMultiplier,
  };
}

function updateMenu(): void {
  if (input.consumeConfirm()) {
    startRun(INITIAL_COUNTDOWN_SEC);
    gameState.transition(GameState.COUNTDOWN);
  }
}

function updateCountdown(dt: number): void {
  countdownRemaining = Math.max(0, countdownRemaining - dt);
  if (countdownRemaining <= 0) {
    gameState.transition(GameState.PLAYING);
  }
}

function updatePlaying(dt: number): void {
  difficulty.update(dt);
  runStats.update(dt);
  particles.update(dt);
  playerTrail.update(dt);

  const moveAxis = input.getMoveAxis();
  const actions = {
    dash: input.consumeDash(),
    attack: input.consumeAttack(),
    dashDirectionHint: input.getTouchDashDirection(),
  };

  const wasAlive = !player.isDead;
  const wasDashing = player.isDashing;
  const wasAttacking = player.isAttacking;

  player.update(dt, moveAxis, actions);
  resolveBoundsCollision(player.body, arena.bounds);
  resolveArenaObstacles(player.body, arena);
  applyHazardDamage(player, arena.hazards);

  if (!wasDashing && player.isDashing) playSfx('dash');
  if (!wasAttacking && player.isAttacking) playSfx('attack');
  if (player.isDashing) playerTrail.record(player.body.position);

  // Keep recording sequential 15s windows for as long as the player is
  // alive, so multiple Echoes accumulate over a run (PRD §6) rather than
  // capping at the single Echo Phase 4 needed to prove playback worked.
  echoRecorder.record(player.body.position, moveAxis, actions);
  if (echoRecorder.isFull(FIXED_DT)) {
    echoes.push(new Echo(echoRecorder.finalize()));
    echoRecorder = new EchoRecorder();
    echoDetectedTimer = ECHO_DETECTED_MESSAGE_SEC;
    runStats.onEchoCreated();
    playSfx('echoSpawn');
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

  const events = resolveCombat(player, enemies, camera, particles, hitStop);
  const echoEvents = resolveEchoCombat(player, echoes, camera, particles, hitStop);
  resolveEnemyEchoCombat(echoes, enemies, camera, particles);
  resolveEchoVsEchoCombat(echoes, camera, particles);

  flow.update(dt);
  if (events.hits > 0) flow.add(FLOW_GAIN_HIT * events.hits);
  if (events.kills > 0) flow.add(FLOW_GAIN_KILL * events.kills);
  if (events.perfectDodges > 0) flow.add(FLOW_GAIN_PERFECT_DODGE * events.perfectDodges);
  if (events.playerHit) flow.onDamageTaken();
  if (echoEvents.kills > 0) flow.add(FLOW_GAIN_ECHO_KILL * echoEvents.kills);
  if (echoEvents.playerHit) flow.onDamageTaken();
  runStats.trackFlowMultiplier(flow.multiplier);

  // Flow effects (PRD §23): a rising sting when Flow climbs a tier, and a
  // distinct, louder one the first time it reaches MAX each run.
  if (FLOW_TIER_RANK[flow.tier] > FLOW_TIER_RANK[previousFlowTier]) {
    if (flow.tier === 'MAX' && !flowMaxPlayedThisRun) {
      playSfx('flowMax');
      flowMaxPlayedThisRun = true;
    } else {
      playSfx('flowIncrease');
    }
  }
  previousFlowTier = flow.tier;

  score.addSurvivalTime(dt, flow.multiplier);
  for (let i = 0; i < events.kills; i++) score.addEnemyKill(flow.multiplier);
  for (let i = 0; i < events.perfectDodges; i++) score.addPerfectDodge(flow.multiplier);
  for (let i = 0; i < echoEvents.kills; i++) score.addEchoKill(flow.multiplier);
  if (events.perfectDodges > 0) runStats.onPerfectDodges(events.perfectDodges);

  // Echo effects (PRD §23): a distinct sound the moment an Echo goes down,
  // regardless of what killed it (attack, hazard, or enemy contact).
  for (const echo of echoes) {
    if (!echo.alive) playSfx('echoDeath');
  }

  echoes = echoes.filter((e) => e.alive);
  // Cap concurrent Echoes so the field never grows past what the
  // DifficultyDirector considers survivable (PRD Phase 7); the oldest
  // Echoes retire first as newer ones join.
  if (echoes.length > difficulty.maxActiveEchoes) {
    echoes = echoes.slice(echoes.length - difficulty.maxActiveEchoes);
  }

  const before = enemies.length;
  enemies = enemies.filter((e) => e.alive);
  if (enemies.length < before) enemyRespawnTimer = difficulty.enemyRespawnDelay;
  if (enemies.length < difficulty.maxEnemies) {
    enemyRespawnTimer -= dt;
    if (enemyRespawnTimer <= 0) {
      enemies.push(spawnEnemyAtSpawnPoint(arena, rng));
      enemyRespawnTimer = difficulty.enemyRespawnDelay;
      playSfx('enemySpawn');
    }
  }

  if (wasAlive && player.isDead) {
    // PRD §27's death sequence: freeze the field (nothing below this branch
    // updates while GAME_OVER holds) for a short impact beat before the run
    // summary appears.
    playSfx('death');
    particles.spawnBurst(player.body.position, PLAYER_DEATH_BURST);
    camera.shake(10, DEATH_SEQUENCE_SEC * 0.5);
    deathTimer = DEATH_SEQUENCE_SEC;
    gameState.transition(GameState.GAME_OVER);
  }
}

function updateGameOver(dt: number): void {
  deathTimer = Math.max(0, deathTimer - dt);
  if (deathTimer <= 0) {
    gameState.transition(GameState.RESULTS);
  }
}

function updateResults(): void {
  if (input.consumeConfirm()) {
    startRun(RESTART_COUNTDOWN_SEC);
    gameState.transition(GameState.COUNTDOWN);
  }
}

function update(dt: number): void {
  music.update(dt, flow.tier);

  switch (gameState.state) {
    case GameState.MENU:
      updateMenu();
      break;
    case GameState.COUNTDOWN:
      updateCountdown(dt);
      break;
    case GameState.PLAYING:
      // Hit-stop (PRD §10, §21) freezes whole fixed-timestep ticks rather
      // than scaling dt, so the freeze can't desync anything deterministic.
      if (!hitStop.tick(dt)) updatePlaying(dt);
      break;
    case GameState.GAME_OVER:
      updateGameOver(dt);
      break;
    case GameState.RESULTS:
      updateResults();
      break;
    case GameState.PAUSED:
      break;
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

function renderWorld(width: number, height: number, renderDt: number): void {
  const { ctx } = canvas;
  camera.follow(player.body.position, renderDt);
  const offset = camera.getOffset(width, height, renderDt);

  drawGrid(ctx, offset);
  drawArenaBounds(ctx, offset);
  for (const enemy of enemies) renderEnemy(ctx, enemy, offset);
  echoes.forEach((echo, index) => renderEcho(ctx, echo, offset, index));
  renderTrail(ctx, playerTrail.points, PLAYER_RADIUS, '#4da6ff', offset);
  if (!player.isDead) renderPlayer(ctx, player, offset);
  renderParticles(ctx, particles.particles, offset);

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

  if (gameState.state === GameState.COUNTDOWN) {
    renderCountdown(ctx, width, height, countdownRemaining);
  }
  if (gameState.state === GameState.GAME_OVER) {
    ctx.save();
    ctx.fillStyle = 'rgba(200, 20, 20, 0.15)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

let lastRenderTime = performance.now();

function render(_alpha: number, fps: number): void {
  const now = performance.now();
  const renderDt = Math.min((now - lastRenderTime) / 1000, 0.1);
  lastRenderTime = now;

  const { ctx, width, height } = canvas;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  switch (gameState.state) {
    case GameState.MENU:
      renderMenu(ctx, width, height);
      break;
    case GameState.RESULTS:
      renderResults(ctx, width, height, buildRunSummary());
      break;
    default:
      renderWorld(width, height, renderDt);
      break;
  }

  ctx.fillStyle = '#666';
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${fps} fps`, 12, height - 14);
}

const loop = new GameLoop(update, render);
loop.start();
