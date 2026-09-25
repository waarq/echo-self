import type { Vector2 } from '../core/Vector2';
import { normalize } from '../core/Vector2';

export const TOUCH_DEADZONE_PX = 6;
export const TOUCH_MAX_DRAG_PX = 70;
export const TOUCH_DASH_DRAG_PX = 40; // release beyond this distance = dash
export const TOUCH_TAP_MAX_DURATION_MS = 220; // release before this + little drag = attack
export const TOUCH_TAP_MAX_DRAG_PX = 12;

/** Pure: turns a raw drag delta (current - origin, in pixels) into a movement
 * axis. Dead-zoned so tiny finger jitter doesn't register as input, and
 * intensity scales with drag distance up to TOUCH_MAX_DRAG_PX so partial
 * drags give partial speed — this is what makes touch feel designed for
 * touch rather than a keyboard control squeezed onto a screen (PRD §36). */
export function axisFromDrag(delta: Vector2): Vector2 {
  const dist = Math.hypot(delta.x, delta.y);
  if (dist <= TOUCH_DEADZONE_PX) return { x: 0, y: 0 };
  const usable = Math.min(dist, TOUCH_MAX_DRAG_PX) - TOUCH_DEADZONE_PX;
  const range = TOUCH_MAX_DRAG_PX - TOUCH_DEADZONE_PX;
  const intensity = range > 0 ? usable / range : 0;
  return { x: (delta.x / dist) * intensity, y: (delta.y / dist) * intensity };
}

export type ReleaseGesture = 'dash' | 'attack' | 'none';

/** Pure: classifies how a touch ended — a fast short tap is an attack, a
 * meaningful drag-and-release is a dash (PRD §36's "quick release -> dash",
 * extended with a tap for the other core action). */
export function classifyRelease(dragDistance: number, holdDurationMs: number): ReleaseGesture {
  if (dragDistance >= TOUCH_DASH_DRAG_PX) return 'dash';
  if (dragDistance <= TOUCH_TAP_MAX_DRAG_PX && holdDurationMs <= TOUCH_TAP_MAX_DURATION_MS) {
    return 'attack';
  }
  return 'none';
}

/** Drag-to-move touch controller: finger position relative to where the
 * touch started defines direction + intensity (PRD §36). Releasing
 * classifies as a dash or attack gesture per classifyRelease(). */
export class TouchInput {
  private origin: Vector2 | null = null;
  private current: Vector2 | null = null;
  private pointerId: number | null = null;
  private touchStartTime = 0;
  private axis: Vector2 = { x: 0, y: 0 };
  private lastDirection: Vector2 = { x: 1, y: 0 };
  private pendingRelease: ReleaseGesture = 'none';

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch' || this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.origin = { x: e.clientX, y: e.clientY };
    this.current = { ...this.origin };
    this.touchStartTime = performance.now();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId || !this.origin) return;
    this.current = { x: e.clientX, y: e.clientY };
    const delta = { x: this.current.x - this.origin.x, y: this.current.y - this.origin.y };
    this.axis = axisFromDrag(delta);
    if (this.axis.x !== 0 || this.axis.y !== 0) {
      this.lastDirection = normalize(delta);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId || !this.origin || !this.current) return;
    const dist = Math.hypot(this.current.x - this.origin.x, this.current.y - this.origin.y);
    const duration = performance.now() - this.touchStartTime;
    this.pendingRelease = classifyRelease(dist, duration);

    this.pointerId = null;
    this.origin = null;
    this.current = null;
    this.axis = { x: 0, y: 0 };
  };

  attach(target: HTMLElement): void {
    target.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  detach(target: HTMLElement): void {
    target.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  get active(): boolean {
    return this.pointerId !== null;
  }

  getMoveAxis(): Vector2 {
    return this.axis;
  }

  /** Last non-zero drag direction — used as the dash direction when the
   * player releases without also holding a keyboard direction. */
  getLastDirection(): Vector2 {
    return this.lastDirection;
  }

  consumeDash(): boolean {
    if (this.pendingRelease === 'dash') {
      this.pendingRelease = 'none';
      return true;
    }
    return false;
  }

  consumeAttack(): boolean {
    if (this.pendingRelease === 'attack') {
      this.pendingRelease = 'none';
      return true;
    }
    return false;
  }
}
