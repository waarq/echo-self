import { describe, expect, it } from 'vitest';
import { ParticleSystem } from './ParticleSystem';

describe('ParticleSystem', () => {
  it('starts empty', () => {
    expect(new ParticleSystem().particles).toHaveLength(0);
  });

  it('spawnBurst adds exactly `count` particles at the origin', () => {
    const system = new ParticleSystem();
    system.spawnBurst(
      { x: 10, y: 20 },
      { count: 8, speed: 100, lifetime: 0.5, radius: 3, color: '#fff' },
    );
    expect(system.particles).toHaveLength(8);
    for (const p of system.particles) {
      expect(p.position).toEqual({ x: 10, y: 20 });
      expect(p.age).toBe(0);
      expect(p.lifetime).toBe(0.5);
    }
  });

  it('update() moves particles by velocity * dt and ages them', () => {
    const system = new ParticleSystem();
    system.particles.push({
      position: { x: 0, y: 0 },
      velocity: { x: 100, y: -50 },
      age: 0,
      lifetime: 1,
      radius: 2,
      color: '#fff',
    });

    system.update(0.1);

    const [p] = system.particles;
    expect(p.position.x).toBeCloseTo(10, 5);
    expect(p.position.y).toBeCloseTo(-5, 5);
    expect(p.age).toBeCloseTo(0.1, 5);
  });

  it('update() removes particles once they exceed their lifetime', () => {
    const system = new ParticleSystem();
    system.particles.push({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      age: 0,
      lifetime: 0.2,
      radius: 2,
      color: '#fff',
    });

    system.update(0.1);
    expect(system.particles).toHaveLength(1);
    system.update(0.2);
    expect(system.particles).toHaveLength(0);
  });

  it('clear() removes every particle', () => {
    const system = new ParticleSystem();
    system.spawnBurst(
      { x: 0, y: 0 },
      { count: 5, speed: 10, lifetime: 1, radius: 1, color: '#fff' },
    );
    system.clear();
    expect(system.particles).toHaveLength(0);
  });
});
