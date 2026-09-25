import type { Vector2 } from '../core/Vector2';
import { clampMagnitude, length, normalize, scale } from '../core/Vector2';
import { Body } from '../physics/Body';
import { moveToward } from '../physics/Forces';

export const PLAYER_RADIUS = 18;
export const PLAYER_MAX_SPEED = 420; // px/s
export const PLAYER_ACCEL = 2800; // px/s^2 — reaches max speed in ~0.15s
export const PLAYER_FRICTION = 3400; // px/s^2 — stops slightly faster than it starts

export const PLAYER_MAX_HP = 3;
export const PLAYER_HIT_INVULN_SEC = 0.8;
export const PLAYER_RESPAWN_INVULN_SEC = 1.2;

export const DASH_SPEED = 1050;
export const DASH_DURATION = 0.14;
export const DASH_COOLDOWN = 0.55;

export const ATTACK_RANGE = 72;
export const ATTACK_ARC = Math.PI / 2; // 90°, centered on facing
export const ATTACK_DURATION = 0.12;
export const ATTACK_COOLDOWN = 0.3;

export interface PlayerActions {
  dash: boolean;
  attack: boolean;
  /** Direction to dash toward when no move axis is held (e.g. touch drag
   * direction at release). Falls back to current facing. */
  dashDirectionHint?: Vector2;
}

/** The player character. Dash and attack are both cooldown-gated, mutually
 * exclusive states layered on top of the Phase 1 movement so "does it feel
 * good to move" stays untouched (PRD §9, §11). */
export class Player {
  readonly body: Body;
  facing = 0; // radians, retained across frames of no input

  hp = PLAYER_MAX_HP;
  invulnerableTimer = 0;

  private dashCooldownTimer = 0;
  private dashActiveTimer = 0;
  private dashDirection: Vector2 = { x: 1, y: 0 };

  private attackCooldownTimer = 0;
  private attackActiveTimer = 0;
  private attackFacing = 0;
  /** Enemy ids already hit by the current swing, so a multi-frame hitbox
   * only damages each target once. */
  hitTargetsThisSwing = new Set<number>();
  /** Cleared at the start of each dash; CombatSystem sets this once it has
   * awarded the "perfect dodge" for the current dash, so a dash that stays
   * overlapped with an enemy across several frames only scores once. */
  perfectDodgeAwardedThisDash = false;

  constructor(position: Vector2) {
    this.body = new Body(position, PLAYER_RADIUS);
  }

  get isDashing(): boolean {
    return this.dashActiveTimer > 0;
  }

  get isAttacking(): boolean {
    return this.attackActiveTimer > 0;
  }

  get isInvulnerable(): boolean {
    return this.invulnerableTimer > 0;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  getAttackHitbox(): { origin: Vector2; facing: number; range: number; arc: number } {
    return {
      origin: this.body.position,
      facing: this.attackFacing,
      range: ATTACK_RANGE,
      arc: ATTACK_ARC,
    };
  }

  takeDamage(amount: number): void {
    if (this.isInvulnerable || this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = PLAYER_HIT_INVULN_SEC;
  }

  reset(position: Vector2): void {
    this.body.position = { ...position };
    this.body.velocity = { x: 0, y: 0 };
    this.hp = PLAYER_MAX_HP;
    this.invulnerableTimer = PLAYER_RESPAWN_INVULN_SEC;
    this.dashCooldownTimer = 0;
    this.dashActiveTimer = 0;
    this.attackCooldownTimer = 0;
    this.attackActiveTimer = 0;
    this.hitTargetsThisSwing.clear();
  }

  update(dt: number, moveAxis: Vector2, actions: PlayerActions): void {
    this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - dt);
    this.dashActiveTimer = Math.max(0, this.dashActiveTimer - dt);
    this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    this.attackActiveTimer = Math.max(0, this.attackActiveTimer - dt);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

    const input = clampMagnitude(moveAxis, 1);
    if (length(input) > 0.001) {
      this.facing = Math.atan2(input.y, input.x);
    }

    if (
      actions.dash &&
      this.dashCooldownTimer <= 0 &&
      !this.isDashing &&
      !this.isAttacking &&
      !this.isDead
    ) {
      const hint = actions.dashDirectionHint;
      const dir =
        length(input) > 0.001
          ? normalize(input)
          : hint && length(hint) > 0.001
            ? normalize(hint)
            : { x: Math.cos(this.facing), y: Math.sin(this.facing) };
      this.dashDirection = dir;
      this.dashActiveTimer = DASH_DURATION;
      this.dashCooldownTimer = DASH_COOLDOWN;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, DASH_DURATION);
      this.facing = Math.atan2(dir.y, dir.x);
      this.perfectDodgeAwardedThisDash = false;
    }

    if (
      actions.attack &&
      this.attackCooldownTimer <= 0 &&
      !this.isAttacking &&
      !this.isDashing &&
      !this.isDead
    ) {
      this.attackActiveTimer = ATTACK_DURATION;
      this.attackCooldownTimer = ATTACK_COOLDOWN;
      this.attackFacing = this.facing;
      this.hitTargetsThisSwing.clear();
    }

    if (this.isDashing) {
      this.body.velocity = scale(this.dashDirection, DASH_SPEED);
    } else if (!this.isDead) {
      const targetVelocity = scale(input, PLAYER_MAX_SPEED);
      const rate = length(input) > 0 ? PLAYER_ACCEL : PLAYER_FRICTION;
      this.body.velocity = moveToward(this.body.velocity, targetVelocity, rate * dt);
    } else {
      this.body.velocity = moveToward(this.body.velocity, { x: 0, y: 0 }, PLAYER_FRICTION * dt);
    }

    this.body.integrate(dt);
  }
}
