import type { Particle } from '../systems/ParticleSystem';
import type { Vector2 } from '../core/Vector2';

/** Draws every particle as a small circle fading out over its lifetime. */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: readonly Particle[],
  offset: Vector2,
): void {
  ctx.save();
  for (const particle of particles) {
    const alpha = Math.max(0, 1 - particle.age / particle.lifetime);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(
      particle.position.x + offset.x,
      particle.position.y + offset.y,
      particle.radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
