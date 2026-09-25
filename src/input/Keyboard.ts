import type { Vector2 } from '../core/Vector2';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const UP_KEYS = new Set(['ArrowUp', 'KeyW']);
const DOWN_KEYS = new Set(['ArrowDown', 'KeyS']);

/** Pure so it's testable without a DOM: turns the set of currently-held key
 * codes into a movement axis in [-1, 1] per component. */
export function axisFromKeys(held: ReadonlySet<string>): Vector2 {
  let x = 0;
  let y = 0;
  for (const code of held) {
    if (LEFT_KEYS.has(code)) x -= 1;
    if (RIGHT_KEYS.has(code)) x += 1;
    if (UP_KEYS.has(code)) y -= 1;
    if (DOWN_KEYS.has(code)) y += 1;
  }
  return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
}

export class Keyboard {
  private held = new Set<string>();
  private onKeyDown = (e: KeyboardEvent): void => {
    this.held.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code);
  };

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  isHeld(code: string): boolean {
    return this.held.has(code);
  }

  getMoveAxis(): Vector2 {
    return axisFromKeys(this.held);
  }
}
