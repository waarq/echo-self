import type { Vector2 } from '../core/Vector2';
import { clampMagnitude } from '../core/Vector2';
import { Keyboard } from './Keyboard';
import { TouchInput } from './Touch';

/** Merges keyboard and touch into one platform-agnostic movement axis so
 * gameplay code never has to know which device produced the input (PRD: "the
 * same gameplay must work naturally on both"). */
export class InputManager {
  readonly keyboard = new Keyboard();
  readonly touch = new TouchInput();

  attach(surface: HTMLElement): void {
    this.keyboard.attach();
    this.touch.attach(surface);
  }

  detach(surface: HTMLElement): void {
    this.keyboard.detach();
    this.touch.detach(surface);
  }

  getMoveAxis(): Vector2 {
    const kb = this.keyboard.getMoveAxis();
    if (kb.x !== 0 || kb.y !== 0) return kb;
    const touch = this.touch.getMoveAxis();
    return clampMagnitude(touch, 1);
  }
}
