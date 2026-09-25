import type { Vector2 } from '../core/Vector2';
import { length, normalize, scale } from '../core/Vector2';
import { Body } from '../physics/Body';
import { moveToward } from '../physics/Forces';

export const CHASER_RADIUS = 16;
export const CHASER_MAX_SPEED = 190;
export const CHASER_ACCEL = 900;
export const CHASER_MAX_HP = 2;
export const CHASER_TOUCH_DAMAGE = 1;
export const CHASER_CONTACT_KNOCKBACK = 320;

let nextEnemyId = 1;

/** Enemy 01 — Chaser (PRD §17): simplest possible enemy, always accelerates
 * toward the player. Deliberately dumb; depth is meant to come from the
 * player's own movement/timing/Echo interactions, not enemy AI. */
export class Enemy {
  readonly id: number;
  readonly body: Body;
  hp = CHASER_MAX_HP;
  hitFlashTimer = 0;
  alive = true;

  constructor(position: Vector2) {
    this.id = nextEnemyId++;
    this.body = new Body(position, CHASER_RADIUS);
  }

  update(dt: number, targetPosition: Vector2): void {
    if (!this.alive) return;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    const toTarget = {
      x: targetPosition.x - this.body.position.x,
      y: targetPosition.y - this.body.position.y,
    };
    const direction = length(toTarget) > 0.001 ? normalize(toTarget) : { x: 0, y: 0 };
    const targetVelocity = scale(direction, CHASER_MAX_SPEED);
    this.body.velocity = moveToward(this.body.velocity, targetVelocity, CHASER_ACCEL * dt);
    this.body.integrate(dt);
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlashTimer = 0.1;
    if (this.hp <= 0) this.alive = false;
  }
}
