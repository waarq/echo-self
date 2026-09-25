# ECHO//SELF

## Master PRD + AI-Assisted Development Specification

### Working Title

**ECHO//SELF**

### Genre

Endless single-player arcade action / physics / roguelite-lite / reflex / survival

### Platform

Primary:

* Web
* Desktop browser
* Mobile browser

Architecture should allow future packaging for:

* Android
* iOS
* Steam / desktop

### Input

Mobile:

* Touch
* Drag
* Tap

Desktop:

* Keyboard
* Mouse

The same gameplay must work naturally on both.

---

# 1. PRODUCT VISION

Build a minimalist, highly polished, endless single-player arcade game centered around one core idea:

> **You are fighting increasingly dangerous versions of yourself.**

Every meaningful action the player performs can eventually become an **Echo**.

An Echo is a recording of the player's previous behavior that is replayed as an autonomous clone.

The player therefore gradually encounters:

* their previous movement
* their previous attacks
* their previous mistakes
* their previous strategies
* eventually, their own fighting style

The game should create the psychological feeling of:

> "I'm not fighting the game anymore. I'm fighting what I used to do."

The experience should be:

* immediately understandable
* extremely easy to start
* difficult to master
* visually minimal
* mechanically deep
* physically satisfying
* fast
* responsive
* replayable
* endlessly scalable
* suitable for short 30-second sessions or long survival runs

The game must prioritize **feel over complexity**.

---

# 2. CORE DESIGN PRINCIPLES

Everything must follow these principles.

## Principle 1 — Minimal Controls

The player should require very few inputs.

Desktop:

* A / D or Left / Right → movement
* Space → dash / primary action
* E / Shift → optional ability
* Mouse → optional directional aiming

Mobile:

* Drag → movement / directional control
* Release → dash / attack
* Tap → ability

Do NOT create complicated ability bars.

The complexity must come from interactions between simple mechanics.

---

# 3. CORE GAMEPLAY LOOP

The fundamental loop:

```text
START RUN
    ↓
MOVE
    ↓
DODGE
    ↓
ATTACK
    ↓
BUILD FLOW
    ↓
SURVIVE
    ↓
CREATE ECHO
    ↓
FIGHT ECHO
    ↓
COMBINE MULTIPLE ECHOES
    ↓
INCREASINGLY COMPLEX ARENAS
    ↓
TAKE GREATER RISKS
    ↓
DIE
    ↓
RUN BECOMES AN ECHO
    ↓
RESTART
```

The game must continuously encourage:

> "One more run."

---

# 4. THE ECHO SYSTEM

This is the central mechanic.

During a run, record the player's gameplay state at a fixed simulation interval.

Record:

* position
* velocity
* facing direction
* movement input
* dash
* attack
* ability usage
* collisions
* important interaction events

Do NOT record raw video.

Record deterministic gameplay events/state.

Example:

```ts
interface EchoFrame {
  timestamp: number;
  position: Vector2;
  velocity: Vector2;
  facing: number;

  input: {
    moveX: number;
    moveY: number;
  };

  actions: {
    attack: boolean;
    dash: boolean;
    ability: boolean;
  };
}
```

The Echo should replay the player's behavior deterministically.

---

# 5. ECHO TIMELINE

Initially:

The player survives for 20–30 seconds.

Then:

```text
ECHO DETECTED
```

A translucent version of the player's character appears.

That Echo reproduces what the player did earlier.

Example:

```text
0s       Player moves right
5s       Player jumps/dashes
8s       Player attacks
12s      Player retreats
15s      Player attacks
```

When replayed:

The Echo performs those actions.

---

# 6. MULTIPLE ECHOES

As the run continues:

```text
YOU
ECHO 01
ECHO 02
ECHO 03
...
```

Each Echo represents a different section of the player's history.

The player eventually fights:

> **multiple versions of themselves simultaneously.**

The system must prevent the screen from becoming visually unreadable.

Echoes should use:

* reduced opacity
* simplified effects
* slightly different visual treatment
* lower particle count
* clear silhouettes

The player must always be immediately identifiable.

---

# 7. ECHO INTERACTION

Echoes must not merely attack the player.

They should interact with:

* enemies
* hazards
* projectiles
* other Echoes
* environmental objects

This creates emergent situations.

Example:

```text
PLAYER
   ↓
dodges projectile

ECHO-01
   ↓
replays old attack

ECHO-02
   ↓
replays previous dash

PROJECTILE
   ↓
hits ECHO-01
```

The player's own past becomes a tool.

---

# 8. PHYSICS

Physics must feel extremely responsive.

Implement:

* acceleration
* deceleration
* velocity
* friction
* momentum
* knockback
* dash impulse
* collision detection
* wall collision
* bounce
* attack hitboxes
* projectile movement
* interpolation
* fixed timestep simulation

Avoid floaty movement.

The character should feel:

* precise
* fast
* controllable
* weighty during impacts
* extremely responsive during movement

Prioritize gameplay responsiveness over realistic physics.

---

# 9. DASH

Dash is one of the primary mechanics.

The dash should:

* temporarily increase movement speed
* provide brief invulnerability
* create motion trail
* create strong anime-style animation
* interact with enemies
* interact with projectiles
* interact with Echoes
* generate Flow

Perfectly timed dashes should feel extremely satisfying.

---

# 10. PERFECT DODGE

If the player narrowly avoids an attack:

Trigger:

```text
PERFECT
```

Effects:

* tiny time slowdown
* impact frame
* screen shake
* particle burst
* sound effect
* Flow increase

The effect must be brief.

Do not slow the game excessively.

The purpose is to create a dopamine spike.

---

# 11. COMBAT

Combat should remain extremely simple.

Potential basic attack:

```text
attack direction
      ↓
  slash arc
```

Attack properties:

* short range
* fast
* predictable
* strong hit feedback
* knockback
* possible combo interaction

Avoid complicated combos initially.

Depth should come from:

**movement + timing + positioning + Echo interactions.**

---

# 12. FLOW SYSTEM

Flow is the player's temporary momentum score.

Flow increases through:

* successful attacks
* consecutive hits
* perfect dodges
* killing enemies
* destroying Echoes
* close calls
* movement chains
* environmental interactions

Flow decreases when:

* player gets hit
* player stops interacting
* player repeatedly misses
* player takes excessive damage

High Flow should increase:

* score multiplier
* visual intensity
* music intensity
* reward generation

Do NOT make high Flow mandatory for survival.

It should be a risk/reward system.

---

# 13. RISK / REWARD

The player should constantly face decisions:

Safe:

> Slow down and survive.

Risky:

> Stay aggressive and build Flow.

Example:

```text
LOW FLOW
Score x1

MEDIUM FLOW
Score x2

HIGH FLOW
Score x4

MAX FLOW
Score x8
```

But high Flow also increases environmental intensity.

The player should think:

> "I could play safely..."

or:

> "Let's push it."

---

# 14. ENDLESS DIFFICULTY

The game must never become literally impossible.

Difficulty should scale using:

### Enemy count

### Enemy behavior

### Arena complexity

### Projectile patterns

### Echo count

### Hazard frequency

### Movement constraints

### Timing windows

### Interaction complexity

Avoid simply increasing enemy health infinitely.

Difficulty should increase primarily through:

> **decision density**

rather than raw numerical scaling.

---

# 15. DIFFICULTY CURVE

Initial target:

### 0–30 seconds

Tutorial through gameplay.

Only basic enemies.

### 30–60 seconds

First Echo.

### 1–2 minutes

Multiple threats.

### 2–3 minutes

Environmental hazards.

### 3–5 minutes

Multiple Echoes.

### 5–10 minutes

Echoes interact with one another.

### 10+ minutes

High-density procedural encounters.

### Endless

Difficulty continues scaling but always preserves at least one viable survival strategy.

---

# 16. PROCEDURAL ARENA GENERATION

The game should not use one static arena forever.

Generate modular arenas from reusable pieces.

Arena components:

* platforms
* walls
* open areas
* narrow passages
* obstacles
* hazard zones
* spawn points
* environmental interactables

Every generated arena must satisfy gameplay constraints.

Never generate:

* impossible spawn positions
* unavoidable damage
* inaccessible areas
* dead-end traps without escape
* impossible projectile patterns

Create a validation system.

```ts
validateArena(arena): boolean
```

Reject invalid arenas.

---

# 17. ENEMY DESIGN

Start with only 3 enemy archetypes.

## Enemy 01 — Chaser

Moves toward player.

Simple.

## Enemy 02 — Shooter

Maintains distance.

Fires predictable projectiles.

## Enemy 03 — Dasher

Telegraphs attack.

Charges toward player.

These three should create most of the early gameplay.

Additional enemies should only be introduced after the core game is fun.

---

# 18. CLONE / ECHO VISUAL LANGUAGE

The player:

* highest visual contrast
* strongest animation
* clearest outline

Echoes:

* lower opacity
* ghost trails
* subtle visual distortion

Older Echoes may visually degrade.

Example:

```text
PLAYER
100% clarity

ECHO-01
80%

ECHO-02
65%

ECHO-03
50%
```

Never make Echoes impossible to distinguish from the player.

---

# 19. ART DIRECTION

Style:

**minimal anime action aesthetic**

Avoid:

* generic anime game UI
* excessive neon
* cyberpunk cliché
* giant text
* clutter
* excessive particles
* generic AI-generated character art

Use:

* clean silhouettes
* sharp anime-inspired animation
* strong poses
* speed lines
* impact frames
* controlled particle effects
* restrained colors
* cinematic composition

The visual identity should feel premium rather than flashy.

---

# 20. COLOR SYSTEM

Use a restrained palette.

Base:

* near-black
* off-white
* muted gray

One primary accent.

One danger accent.

Do not introduce dozens of colors.

The player should remain visually dominant.

---

# 21. ANIMATION

Animation is extremely important.

Required animation states:

* idle
* run
* dash
* attack
* hurt
* death
* perfect dodge
* spawn
* Echo playback
* Echo death

Use animation principles inspired by anime action:

* anticipation
* squash/stretch
* overshoot
* follow-through
* smear-like motion
* impact frames
* directional trails

Animation must communicate gameplay.

---

# 22. CAMERA

Camera should be subtle.

Implement:

* smooth follow
* small impact shake
* dash movement
* slight dynamic zoom
* controlled screen shake

Avoid nausea.

Screen shake should be configurable.

---

# 23. AUDIO

Audio must contribute significantly to game feel.

Required:

* dash
* attack
* hit
* perfect dodge
* enemy spawn
* Echo spawn
* Echo death
* player damage
* Flow increase
* Flow maximum
* death

Music should dynamically change according to Flow.

Low Flow:

minimal ambient rhythm.

High Flow:

faster percussion / intensity.

Maximum Flow:

high-adrenaline section.

---

# 24. GAME STATES

Implement explicit states:

```ts
enum GameState {
  MENU,
  COUNTDOWN,
  PLAYING,
  PAUSED,
  GAME_OVER,
  RESULTS
}
```

Never scatter game-state logic across random components.

Use a centralized state machine.

---

# 25. SCORE

Primary score sources:

* survival time
* enemy kills
* Echo kills
* perfect dodges
* Flow multiplier
* risk actions

Example:

```text
TIME              +100
ENEMY             +250
PERFECT DODGE     +500
ECHO              +1000
FLOW MULTIPLIER   ×4
```

Tune values later.

The exact numbers are placeholders.

---

# 26. LEADERBOARD-STYLE PERSONAL RECORD

Even without online multiplayer, create personal competition.

Track:

* highest score
* longest survival
* most Echoes defeated
* highest Flow
* perfect dodges
* fastest 1-minute score
* longest streak

The player should compete against:

> **their own previous best.**

---

# 27. DEATH SYSTEM

Death must be satisfying rather than frustrating.

Sequence:

```text
PLAYER HIT
↓
TIME FREEZE
↓
IMPACT FRAME
↓
CHARACTER COLLAPSES
↓
AUDIO CUT
↓
RUN SUMMARY
```

Then:

```text
RUN RECORDED

SURVIVAL
04:37

SCORE
184,920

ECHOES CREATED
7

PERFECT DODGES
42

MAX FLOW
x7
```

Then:

# AGAIN

The restart button should be extremely prominent.

Target:

**death → restart within 2 seconds.**

---

# 28. THE MOST IMPORTANT PSYCHOLOGICAL LOOP

The player must experience:

```text
"I can do better."

"I almost survived."

"That was my mistake."

"I understand what happened."

"One more run."

"I'll beat my previous Echo."

"I can push Flow further."

"One more."
```

Do not rely on artificial energy systems or lives.

The gameplay itself should create the replay loop.

---

# 29. NO ENERGY SYSTEM

Never require:

* waiting
* lives
* stamina regeneration
* ads to continue
* artificial timers

The game should respect the player's time.

---

# 30. MVP

The first playable version should contain ONLY:

### Player

* movement
* dash
* attack
* collision

### Enemy

* Chaser

### Arena

* one procedural arena

### Echo

* 15-second recording
* replay

### Flow

* basic multiplier

### Game loop

* start
* play
* die
* restart

### Input

* keyboard
* mouse/touch

Nothing else.

---

# 31. TECHNICAL STACK

Preferred implementation:

### Web

TypeScript

### Rendering

HTML5 Canvas

Use a lightweight game architecture rather than building the game around DOM elements.

Possible libraries:

* Phaser 3 OR
* PixiJS + custom gameplay loop

Choose Phaser if it materially accelerates development.

Do NOT introduce a large framework unnecessarily.

React/Next.js should NOT control the real-time game loop.

If a web shell is required, keep game rendering isolated.

---

# 32. ARCHITECTURE

Separate:

```text
GAME
├── Core
│   ├── GameLoop
│   ├── GameState
│   ├── Time
│   └── Random
│
├── Physics
│   ├── Body
│   ├── Collision
│   ├── Forces
│   └── SpatialHash
│
├── Entities
│   ├── Player
│   ├── Echo
│   ├── Enemy
│   └── Projectile
│
├── Systems
│   ├── CombatSystem
│   ├── EchoSystem
│   ├── FlowSystem
│   ├── ArenaSystem
│   ├── DifficultySystem
│   └── ScoreSystem
│
├── Input
│   ├── Keyboard
│   ├── Mouse
│   └── Touch
│
├── Rendering
│   ├── PlayerRenderer
│   ├── EchoRenderer
│   ├── Effects
│   └── Camera
│
├── Audio
│   ├── SFX
│   └── Music
│
└── UI
    ├── Menu
    ├── HUD
    └── Results
```

---

# 33. FIXED TIMESTEP

Use a fixed simulation timestep.

Conceptually:

```text
INPUT
 ↓
UPDATE
 ↓
PHYSICS
 ↓
COLLISION
 ↓
GAME LOGIC
 ↓
RENDER
```

Rendering may run at variable FPS.

Simulation should remain deterministic.

This is especially important because Echoes depend on reproducible gameplay.

---

# 34. DETERMINISM

Create a seeded random number generator.

Each run should have:

```ts
runSeed
```

Store it with the run.

This allows:

* debugging
* replay testing
* deterministic Echo behavior
* future replay sharing

---

# 35. ECHO RECORDING ARCHITECTURE

Do not save thousands of unnecessary objects.

Use compact event/state recording.

Example:

```ts
interface EchoEvent {
  t: number;
  type:
    | "MOVE"
    | "ATTACK"
    | "DASH"
    | "ABILITY"
    | "HIT"
    | "DEATH";
  data?: unknown;
}
```

The Echo should reconstruct behavior from the event timeline.

Use interpolation between recorded movement samples.

---

# 36. TOUCH CONTROL

Touch input must not feel like a desktop game squeezed onto mobile.

Design specifically for touch.

Possible model:

```text
finger position
      ↓
direction

drag distance
      ↓
movement intensity

quick release
      ↓
dash
```

Make controls forgiving.

Use input buffering.

Do not require pixel-perfect taps.

---

# 37. INPUT BUFFERING

Player input should be forgiving.

If the player presses dash slightly before the allowed window:

Store the input briefly.

Example:

```text
inputBuffer = 100ms
```

This makes controls feel responsive.

---

# 38. GAME FEEL PRIORITY

When tuning mechanics, prioritize:

1. responsiveness
2. movement
3. dash
4. collision
5. hit feedback
6. camera
7. sound
8. particles
9. progression
10. visual polish

Do not spend hours designing menus while movement feels bad.

---

# 39. DEVELOPMENT PHASES

## PHASE 0 — PROJECT FOUNDATION

Create:

* repository
* TypeScript
* game renderer
* development environment
* linting
* formatting
* testing
* build system
* basic CI

Deliverable:

A blank game canvas running at stable FPS.

---

# PHASE 1 — MOVEMENT PROTOTYPE

Implement:

* player
* movement
* acceleration
* friction
* collision
* camera
* keyboard input
* touch input

Deliverable:

A character that feels excellent to control.

### Acceptance test

The player should immediately feel:

> "This is responsive."

Do not continue until this feels good.

---

# PHASE 2 — DASH + COMBAT

Implement:

* dash
* invulnerability window
* attack
* hitbox
* knockback
* enemy
* damage
* death

Add:

* screen shake
* impact animation
* sound hooks

Deliverable:

A 30-second combat sandbox.

---

# PHASE 3 — FLOW SYSTEM

Implement:

* Flow meter
* combo
* score multiplier
* perfect dodge
* risk/reward

Deliverable:

A player should naturally want to maintain Flow.

---

# PHASE 4 — FIRST ECHO

Implement:

* recording
* playback
* Echo rendering
* Echo collision
* Echo attacks
* Echo death

First test:

```text
Player survives 15 seconds.
↓
Echo appears.
↓
Echo repeats those 15 seconds.
```

This is the first major milestone.

---

# PHASE 5 — ECHO INTERACTIONS

Implement:

* Echo vs enemy
* Echo vs projectile
* Echo vs player
* Echo vs Echo

Ensure deterministic playback.

Deliverable:

Emergent combat scenarios.

---

# PHASE 6 — PROCEDURAL ARENAS

Implement:

* modular arena pieces
* procedural generation
* spawn points
* hazards
* validation
* difficulty-aware generation

Every arena must remain playable.

---

# PHASE 7 — DIFFICULTY DIRECTOR

Create a central:

```ts
DifficultyDirector
```

It controls:

* enemy frequency
* enemy types
* projectile density
* arena complexity
* Echo frequency
* hazard frequency

It must never directly make the game impossible.

---

# PHASE 8 — COMPLETE GAME LOOP

Implement:

```text
MENU
 ↓
COUNTDOWN
 ↓
RUN
 ↓
ESCALATION
 ↓
DEATH
 ↓
RESULTS
 ↓
RESTART
```

Target restart latency:

**<2 seconds.**

---

# PHASE 9 — AUDIO + JUICE

Add:

* SFX
* music
* dynamic music intensity
* impact frames
* particles
* trails
* camera shake
* hit stop
* Flow effects
* Echo effects

This phase should dramatically improve perceived quality.

---

# PHASE 10 — ANIME ART PASS

Replace placeholder shapes with:

* final character silhouette
* animation system
* slash effects
* dash trails
* Echo visuals
* environmental style

Keep visual language minimal.

---

# PHASE 11 — MOBILE UX

Test on:

* phone portrait
* phone landscape
* tablet

Tune:

* touch sensitivity
* virtual interaction area
* gesture recognition
* UI scale
* performance
* battery consumption

---

# PHASE 12 — PERFORMANCE

Target:

### Desktop

60 FPS minimum.

### Mobile

Target 60 FPS on reasonably modern devices.

Optimize:

* particles
* collision detection
* object pooling
* rendering
* Echo memory
* procedural generation

Use object pooling for frequently created objects.

---

# PHASE 13 — POLISH

Polish:

* menus
* typography
* transitions
* sound
* animations
* particles
* accessibility
* settings
* pause menu
* reduced motion
* volume controls

---

# PHASE 14 — QA

Create automated tests for:

### Physics

* movement
* collision
* dash
* knockback

### Echo

* recording
* playback
* timing
* determinism

### Procedural generation

* valid arena
* reachable spawn
* no impossible layouts

### Game state

* pause
* death
* restart
* reset

### Input

* keyboard
* mouse
* touch

---

# PHASE 15 — RELEASE BUILD

Prepare:

* production build
* loading screen
* favicon
* metadata
* responsive layout
* performance profiling
* error handling
* analytics hooks

Analytics must respect privacy and should initially be optional/minimal.

---

# 40. AI DEVELOPMENT RULES

This project will be developed heavily with AI coding agents.

The AI agent MUST follow these rules.

## Rule 1

Never generate the entire game in one shot.

Build phase-by-phase.

## Rule 2

Before implementing a feature, inspect the existing architecture.

Do not blindly overwrite existing files.

## Rule 3

Never create duplicate systems.

Before creating:

```text
PhysicsSystem
InputSystem
GameState
EchoSystem
```

search the repository.

## Rule 4

Prefer small, composable systems.

## Rule 5

Do not over-engineer the MVP.

## Rule 6

Do not introduce dependencies without justification.

## Rule 7

Do not use React state for high-frequency gameplay state.

## Rule 8

Never put the game loop inside React rendering.

## Rule 9

Keep gameplay deterministic wherever possible.

## Rule 10

Every major feature must include tests.

---

# 41. AI AGENT WORKFLOW

For every development task:

### STEP 1

Inspect repository.

### STEP 2

Identify relevant files.

### STEP 3

Explain intended changes briefly.

### STEP 4

Implement.

### STEP 5

Run tests.

### STEP 6

Run type checking.

### STEP 7

Run build.

### STEP 8

Fix errors.

### STEP 9

Review implementation for unnecessary complexity.

### STEP 10

Report:

```text
Implemented:
- ...

Changed:
- ...

Tests:
- ...

Build:
- ...

Known issues:
- ...

Next recommended task:
- ...
```

Never claim a feature works without actually testing it.

---

# 42. AI PROMPT — MASTER INSTRUCTION

You are the lead engineer, game designer, gameplay programmer, technical artist, QA engineer, and performance engineer for this project.

You are building **ECHO//SELF**, an endless minimalist anime arcade game.

Your job is NOT simply to write code.

Your job is to help build a game that is:

* fun
* responsive
* addictive
* readable
* performant
* maintainable
* visually distinctive
* deterministic
* playable on touch and keyboard

Follow the PRD above as the source of truth.

Work incrementally.

Never skip foundational systems.

Never build future systems prematurely.

Before coding:

1. Inspect the repository.
2. Understand the current architecture.
3. Identify existing systems.
4. Identify technical debt.
5. Determine the smallest implementation that satisfies the requirement.

After coding:

1. Run type checking.
2. Run tests.
3. Run the production build.
4. Check for runtime errors.
5. Review performance implications.
6. Check mobile input.
7. Check desktop input.

If something fails, fix it before moving forward.

---

# 43. AI AGENT DEVELOPMENT COMMANDS

Use this development sequence.

## Command 01

> Analyze this repository and prepare the technical architecture required for ECHO//SELF. Do not write gameplay code yet. Identify the current stack, entry points, rendering architecture, dependencies, and risks. Then propose the smallest architecture required for Phase 0.

## Command 02

> Implement Phase 0 only. Create the project foundation and verify that the game renders correctly. Do not implement gameplay yet.

## Command 03

> Implement Phase 1 only. Build the player movement and physics prototype. Focus entirely on responsiveness and game feel. Do not add enemies, combat, progression, or Echoes.

## Command 04

> Implement Phase 2 only. Add dash, attack, collision, damage, knockback, and the first enemy. Preserve the existing architecture.

## Command 05

> Implement Phase 3 only. Add Flow, scoring, perfect dodge, and risk/reward.

## Command 06

> Implement Phase 4 only. Build the Echo recording and deterministic playback system. This is the core technology of the game. Test it thoroughly.

## Command 07

> Implement Phase 5 only. Allow Echoes to interact with enemies, projectiles, the player, and other Echoes.

## Command 08

> Implement Phase 6 only. Build procedural arenas with validation to ensure every generated arena remains playable.

## Command 09

> Implement Phase 7 only. Create the difficulty director and gradually increase complexity while maintaining playable states.

## Command 10

> Implement Phase 8 only. Complete the endless gameplay loop from menu through death and instant restart.

## Command 11

> Implement Phase 9 only. Add game feel: sound, particles, hit-stop, camera shake, trails, impact frames, and Flow feedback.

## Command 12

> Implement Phase 10 only. Apply the final minimalist anime art direction while preserving gameplay readability.

## Command 13

> Implement Phase 11 only. Optimize touch controls and mobile UX.

## Command 14

> Implement Phase 12 only. Profile and optimize the game for stable frame rates and low memory usage.

## Command 15

> Implement Phase 13 only. Perform final UX and accessibility polish.

## Command 16

> Perform a complete QA pass against the PRD. Identify missing functionality, gameplay problems, performance problems, architecture problems, and UX problems. Fix issues in priority order.

---

# 44. IMPORTANT AI BEHAVIOR

The AI must NOT:

* randomly redesign the game
* add unnecessary mechanics
* add multiplayer
* add complicated RPG systems
* add loot boxes
* add energy systems
* add forced advertisements
* add excessive UI
* add generic AI-themed visual elements
* make the game dependent on external APIs
* replace deterministic systems with unpredictable behavior
* sacrifice gameplay responsiveness for visual effects

The AI MAY propose new mechanics only when they strengthen:

> **You vs your own history.**

---

# 45. DEFINITION OF "FUN"

Before adding more content, the AI must evaluate:

### Movement

Does movement feel satisfying?

### Dash

Does dodging feel powerful?

### Combat

Does hitting something feel impactful?

### Echo

Is seeing your previous behavior entertaining?

### Flow

Does maintaining Flow create tension?

### Death

Does failure make the player want another attempt?

If the answer is no:

**improve the existing system before adding new content.**

---

# 46. FINAL DESIGN TEST

The finished game should satisfy this scenario:

A player opens the game without reading instructions.

Within 10 seconds:

They understand movement.

Within 30 seconds:

They understand combat.

Within 60 seconds:

They encounter their first Echo.

Within 2 minutes:

They understand:

> "That thing is me."

Within 5 minutes:

They are deliberately manipulating their Echoes.

When they die:

They immediately want to restart.

That is the target experience.

---

# 47. NORTH STAR

Everything in ECHO//SELF should serve one sentence:

> **"The better you become, the harder your past becomes to defeat."**

The game isn't about defeating an army.

It isn't about collecting weapons.

It isn't about leveling endlessly.

It is about one player becoming increasingly skilled...

...and then being forced to fight the increasingly skilled versions of themselves.

Build the game around that idea.
