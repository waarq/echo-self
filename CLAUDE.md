# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Phases 0–5 are done (project foundation; movement prototype; dash + combat; Flow system; first Echo recording/playback; Echo interactions vs enemy/player/other Echoes — see git log for details of each). Echo vs projectile is deferred until the Shooter enemy exists (no Projectile entity in the codebase yet). Next up per the PRD's phase order: Phase 6, procedural arenas + validation. Track phase completion via git history, not this file — update this line as phases land.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck (`tsc`) then production build to `dist/`
- `npm run preview` — preview the production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint over the whole repo
- `npm run format` / `npm run format:check` — Prettier write / check
- `npm test` — run the Vitest suite once (`npm run test:watch` for watch mode)
- Run a single test file: `npx vitest run src/core/Random.test.ts`

CI (`.github/workflows/ci.yml`) runs format:check, lint, typecheck, test, and build on every push/PR — run all five locally before considering a task done.

## What this project is

**ECHO//SELF** — an endless single-player arcade/roguelite-lite game (web, desktop + mobile browser) built around one idea: the player fights autonomous replays of their own past actions ("Echoes"). Full design spec is in `PRD.md`; read it before implementing any feature — it is the source of truth for mechanics, phases, and constraints.

### Core mechanic

The game records the player's deterministic gameplay state/events (position, velocity, facing, input, dash/attack/ability, collisions) at a fixed interval — never raw video/frames of pixels — and replays that recording as a translucent autonomous clone ("Echo") after ~15–30s. Over a run, multiple Echoes accumulate and fight the player, enemies, hazards, and each other simultaneously. This determinism requirement (fixed timestep simulation, seeded RNG per run) is the foundation the whole architecture is built to preserve — don't introduce non-deterministic gameplay state.

## Intended architecture (from PRD §31–35)

- **Stack**: TypeScript, HTML5 Canvas rendering. Phaser 3 or PixiJS + custom loop are acceptable; don't add a large framework without justification.
- **React/Next.js (if used for a web shell) must never control the real-time game loop or hold high-frequency gameplay state.** Keep the game loop and rendering isolated from any UI framework's render cycle.
- **Module boundaries**: `Core` (GameLoop, GameState, Time, Random) / `Physics` (Body, Collision, Forces, SpatialHash) / `Entities` (Player, Echo, Enemy, Projectile) / `Systems` (CombatSystem, EchoSystem, FlowSystem, ArenaSystem, DifficultySystem, ScoreSystem) / `Input` (Keyboard, Mouse, Touch) / `Rendering` (PlayerRenderer, EchoRenderer, Effects, Camera) / `Audio` / `UI` (Menu, HUD, Results). Before creating a new system (e.g. another PhysicsSystem/InputSystem/GameState/EchoSystem), search the repo first — never create duplicates.
- **Simulation**: fixed timestep, deterministic; rendering may run at variable FPS. Game state (MENU/COUNTDOWN/PLAYING/PAUSED/GAME_OVER/RESULTS) must live in one centralized state machine, not scattered across components.
- **Echo recording**: compact event/state timeline (`{t, type, data}`), not per-frame dumps of every object; reconstruct behavior via interpolation between samples.

## Build order (PRD §39, do not skip ahead)

Phases are strictly sequential — each has a single deliverable and an acceptance bar before moving on: 0. Project foundation (tooling, blank canvas at stable FPS)

1. Movement prototype (must _feel_ responsive before anything else is added)
2. Dash + combat + first enemy (Chaser)
3. Flow system (combo/score multiplier, perfect dodge, risk-reward)
4. First Echo (record 15s → deterministic replay) — first major milestone
5. Echo interactions (vs enemy/projectile/player/other Echoes)
6. Procedural arenas + validation (`validateArena(arena): boolean`, reject unplayable layouts)
7. DifficultyDirector (must never make the game literally unwinnable)
8. Complete game loop (menu → countdown → run → death → results → restart, target <2s restart)
9. Audio + juice (SFX, dynamic music by Flow, hit-stop, particles, trails)
10. Anime art pass (replace placeholders, keep visual language minimal/readable)
11. Mobile UX tuning, 12. Performance (60 FPS target both platforms, object pooling), 13. Polish/accessibility, 14. QA/automated tests, 15. Release build

Enemy set for MVP is limited to 3 archetypes: Chaser, Shooter, Dasher — don't add more until the core loop is fun. MVP scope overall is explicitly minimal (PRD §30): player movement/dash/attack/collision, one Chaser enemy, one procedural arena, 15s Echo record/replay, basic Flow multiplier, start/play/die/restart loop, keyboard + mouse/touch input — nothing else.

## Working rules for this repo (PRD §40, §44)

- Never generate the whole game in one shot; implement one phase at a time and don't build future-phase systems prematurely.
- Inspect existing architecture before adding a feature; don't blindly overwrite files or duplicate systems (Physics/Input/GameState/Echo).
- Keep systems small and composable; don't over-engineer the MVP; don't add dependencies without justification.
- Don't add: multiplayer, RPG/loot systems, energy/stamina/ad-gating, excessive UI, or anything that isn't in service of the "you vs. your own history" concept.
- Any new mechanic must be justifiable as strengthening the core "fighting your own past" idea — this is the bar for scope decisions, not just "would be cool."
- Game feel priority when tuning (PRD §38): responsiveness > movement > dash > collision > hit feedback > camera > sound > particles > progression > visual polish. Don't polish menus while movement feels bad.
