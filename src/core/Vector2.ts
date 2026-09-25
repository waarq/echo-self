export interface Vector2 {
  x: number;
  y: number;
}

export function length(v: Vector2): number {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Vector2): Vector2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function clampMagnitude(v: Vector2, max: number): Vector2 {
  const len = length(v);
  if (len <= max || len === 0) return v;
  return scale(v, max / len);
}
