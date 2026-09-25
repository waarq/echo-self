import type { Vector2 } from '../core/Vector2';

export const TOUCH_DEADZONE_PX = 6;
export const TOUCH_MAX_DRAG_PX = 70;

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

/** Drag-to-move touch controller: finger position relative to where the
 * touch started defines direction + intensity (PRD §36). A quick release
 * (short hold, meaningful drag) is exposed for the dash trigger in Phase 2. */
export class TouchInput {
  private origin: Vector2 | null = null;
  private current: Vector2 | null = null;
  private pointerId: number | null = null;
  private touchStartTime = 0;
  private axis: Vector2 = { x: 0, y: 0 };

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
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
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

  get holdDurationMs(): number {
    return this.active ? performance.now() - this.touchStartTime : 0;
  }

  getMoveAxis(): Vector2 {
    return this.axis;
  }
}
