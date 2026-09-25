import type { Vector2 } from '../core/Vector2';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  age: number;
  lifetime: number;
  radius: number;
  color: string;
}

export interface BurstOptions {
  count: number;
  speed: number;
  /** Fractional random variance applied to `speed` per particle, e.g. 0.3 = +/-30%. */
  speedVariance?: number;
  lifetime: number;
  radius: number;
  color: string;
}

/** Purely cosmetic hit-spark/death-burst particles (PRD §10, §19's
 * "controlled particle effects" — restrained, not the "excessive particles"
 * the art direction explicitly warns against). Never read by gameplay
 * logic, so — like Camera's screen-shake jitter — it's fine for this to use
 * Math.random() rather than the seeded RNG; it can't affect determinism. */
export class ParticleSystem {
  particles: Particle[] = [];

  spawnBurst(origin: Vector2, options: BurstOptions): void {
    const variance = options.speedVariance ?? 0.3;
    for (let i = 0; i < options.count; i++) {
      const angle = (Math.PI * 2 * i) / options.count + (Math.random() - 0.5) * 0.6;
      const speedScale = 1 + (Math.random() * 2 - 1) * variance;
      const speed = options.speed * speedScale;
      this.particles.push({
        position: { ...origin },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        age: 0,
        lifetime: options.lifetime,
        radius: options.radius,
        color: options.color,
      });
    }
  }

  update(dt: number): void {
    for (const particle of this.particles) {
      particle.position.x += particle.velocity.x * dt;
      particle.position.y += particle.velocity.y * dt;
      particle.age += dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.lifetime);
  }

  clear(): void {
    this.particles = [];
  }
}
