import type { Vector2 } from '../core/Vector2';

/** A circle-collider physics body. Position/velocity are the only things the
 * fixed-timestep simulation touches; renderers read from it but never write. */
export class Body {
  position: Vector2;
  velocity: Vector2 = { x: 0, y: 0 };
  radius: number;

  constructor(position: Vector2, radius: number) {
    this.position = { ...position };
    this.radius = radius;
  }

  integrate(dt: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }
}
