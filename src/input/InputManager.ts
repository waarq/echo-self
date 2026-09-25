import type { Vector2 } from '../core/Vector2';
import { clampMagnitude } from '../core/Vector2';
import { Keyboard } from './Keyboard';
import { Mouse } from './Mouse';
import { TouchInput } from './Touch';

const DASH_KEY = 'Space';

/** Merges keyboard, mouse, and touch into one platform-agnostic action set so
 * gameplay code never has to know which device produced the input (PRD: "the
 * same gameplay must work naturally on both"). */
export class InputManager {
  readonly keyboard = new Keyboard();
  readonly mouse = new Mouse();
  readonly touch = new TouchInput();

  attach(surface: HTMLElement): void {
    this.keyboard.attach();
    this.mouse.attach(surface);
    this.touch.attach(surface);
  }

  detach(surface: HTMLElement): void {
    this.keyboard.detach();
    this.mouse.detach(surface);
    this.touch.detach(surface);
  }

  getMoveAxis(): Vector2 {
    const kb = this.keyboard.getMoveAxis();
    if (kb.x !== 0 || kb.y !== 0) return kb;
    const touch = this.touch.getMoveAxis();
    return clampMagnitude(touch, 1);
  }

  /** Direction to dash in when no movement axis is currently held —
   * falls back to the last drag direction on touch. */
  getTouchDashDirection(): Vector2 {
    return this.touch.getLastDirection();
  }

  consumeDash(): boolean {
    return this.keyboard.consumePress(DASH_KEY) || this.touch.consumeDash();
  }

  consumeAttack(): boolean {
    return this.mouse.consumeClick() || this.touch.consumeAttack();
  }
}
