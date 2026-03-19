import { ENEMY_DEATH_EFFECT_DURATION, PLAYER_LEVEL_UP_AURA_DURATION, SPELL_CAST_DELAY } from "../../game-config.js";
import { createProjectile, getEnemyEffectPalette, getSpellPalette } from "../../state-helpers.js";
import type {
  PendingSpellCast,
  ResolvedSpellCastSource
} from "../../app-types.js";
import type { EnemyEntity } from "../../types.js";
import type { CombatSystemHost, EffectParticleSeed, FloatingTextSeed, PendingSpellCastSeed } from "./types.js";

export class CombatEffectsSystem {
  constructor(private readonly host: CombatSystemHost) {}

  startSpellCast(cast: PendingSpellCastSeed): void {
    this.host.pendingSpellCasts.push({
      id: this.host.effectIdCounter++,
      source: cast.source,
      sourceEnemyId: cast.sourceEnemyId,
      element: cast.element,
      direction: cast.direction,
      remaining: SPELL_CAST_DELAY,
      duration: SPELL_CAST_DELAY,
      radius: cast.radius,
      speed: cast.speed,
      range: cast.range,
      damage: cast.damage,
      spawnOffset: cast.spawnOffset
    });
  }

  resolveSpellCastSource(cast: PendingSpellCast): ResolvedSpellCastSource | null {
    if (cast.source === "player") {
      return {
        x: this.host.player.x,
        y: this.host.player.y,
        radius: this.host.player.radius
      };
    }

    const enemy = this.host.enemies.find((entry) => entry.id === cast.sourceEnemyId && !entry.dead);
    if (!enemy) {
      return null;
    }

    return {
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius
    };
  }

  updateSpellCasts(dt: number): void {
    for (let index = this.host.pendingSpellCasts.length - 1; index >= 0; index -= 1) {
      const cast = this.host.pendingSpellCasts[index];
      const source = this.resolveSpellCastSource(cast);

      if (!source) {
        this.host.pendingSpellCasts.splice(index, 1);
        continue;
      }

      cast.remaining = Math.max(0, cast.remaining - dt);
      this.emitSpellChargeParticles(cast, source, dt);

      if (cast.remaining > 0) {
        continue;
      }

      this.host.projectiles.push(
        createProjectile(this.host.projectileIdCounter++, {
          x: source.x + cast.direction.x * (source.radius + cast.spawnOffset),
          y: source.y + cast.direction.y * (source.radius + cast.spawnOffset),
          direction: {
            x: cast.direction.x,
            y: cast.direction.y
          },
          radius: cast.radius,
          remaining: cast.range,
          speed: cast.speed,
          damage: cast.damage,
          owner: cast.source === "player" ? "player" : "enemy",
          element: cast.element
        })
      );

      const palette = getSpellPalette(cast.element);
      for (let burst = 0; burst < 8; burst += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.4;
        this.spawnParticle({
          x: source.x + Math.cos(angle) * 0.12,
          y: source.y + Math.sin(angle) * 0.12,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0.045 + Math.random() * 0.03,
          life: 0.18 + Math.random() * 0.16,
          maxLife: 0.18 + Math.random() * 0.16,
          color: burst % 2 === 0 ? palette.core : palette.mid,
          glow: palette.glow,
          drag: 4.2,
          gravity: -0.15,
          shrink: 1.35,
          shape: "square"
        });
      }

      this.host.pendingSpellCasts.splice(index, 1);
    }
  }

  updateParticles(dt: number): void {
    for (let index = this.host.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.host.particles[index];
      particle.life = Math.max(0, particle.life - dt);
      particle.vx *= Math.max(0, 1 - particle.drag * dt);
      particle.vy *= Math.max(0, 1 - particle.drag * dt);
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.size = Math.max(0.008, particle.size * Math.max(0, 1 - particle.shrink * dt));

      if (particle.life <= 0) {
        this.host.particles.splice(index, 1);
      }
    }
  }

  updateFloatingTexts(dt: number): void {
    for (let index = this.host.floatingTexts.length - 1; index >= 0; index -= 1) {
      const text = this.host.floatingTexts[index];
      text.life = Math.max(0, text.life - dt);
      text.x += text.vx * dt;
      text.y += text.vy * dt;
      text.vx *= Math.max(0, 1 - dt * 2.2);
      text.vy -= dt * 0.08;

      if (text.life <= 0) {
        this.host.floatingTexts.splice(index, 1);
      }
    }
  }

  updateEnemyDeathEffects(dt: number): void {
    for (let index = this.host.enemyDeathEffects.length - 1; index >= 0; index -= 1) {
      const effect = this.host.enemyDeathEffects[index];
      effect.remaining = Math.max(0, effect.remaining - dt);

      if (effect.remaining <= 0) {
        this.host.enemyDeathEffects.splice(index, 1);
      }
    }
  }

  updatePlayerAuraEffects(dt: number): void {
    for (let index = this.host.playerAuraEffects.length - 1; index >= 0; index -= 1) {
      const effect = this.host.playerAuraEffects[index];
      effect.remaining = Math.max(0, effect.remaining - dt);

      if (effect.remaining <= 0) {
        this.host.playerAuraEffects.splice(index, 1);
      }
    }
  }

  spawnLevelUpEffect(): void {
    this.host.playerAuraEffects.push({
      id: this.host.effectIdCounter++,
      kind: "levelUp",
      remaining: PLAYER_LEVEL_UP_AURA_DURATION,
      duration: PLAYER_LEVEL_UP_AURA_DURATION
    });

    for (let sparkle = 0; sparkle < 18; sparkle += 1) {
      const angle = (sparkle / 18) * Math.PI * 2;
      const speed = 0.9 + Math.random() * 1.6;
      this.spawnParticle({
        x: this.host.player.x + Math.cos(angle) * 0.12,
        y: this.host.player.y + Math.sin(angle) * 0.12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.12,
        size: 0.045 + Math.random() * 0.028,
        life: 0.3 + Math.random() * 0.24,
        maxLife: 0.3 + Math.random() * 0.24,
        color: sparkle % 2 === 0 ? "#d9ffc0" : "#72dc82",
        glow: "rgba(114, 220, 130, 0.36)",
        drag: 3.2,
        gravity: -0.05,
        shrink: 1.2,
        shape: "square"
      });
    }
  }

  spawnEnemyDeathEffect(enemy: EnemyEntity): void {
    this.host.enemyDeathEffects.push({
      id: this.host.effectIdCounter++,
      kind: enemy.kind,
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius,
      remaining: ENEMY_DEATH_EFFECT_DURATION,
      duration: ENEMY_DEATH_EFFECT_DURATION
    });

    const palette = getEnemyEffectPalette(enemy.kind);
    for (let fragment = 0; fragment < 14; fragment += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * 1.8;
      this.spawnParticle({
        x: enemy.x + Math.cos(angle) * enemy.radius * 0.3,
        y: enemy.y + Math.sin(angle) * enemy.radius * 0.22,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.08,
        size: 0.05 + Math.random() * 0.03,
        life: 0.2 + Math.random() * 0.18,
        maxLife: 0.2 + Math.random() * 0.18,
        color: fragment % 2 === 0 ? palette.mid : palette.core,
        glow: palette.glow,
        drag: 3.7,
        gravity: 0.12,
        shrink: 1.35,
        shape: fragment % 3 === 0 ? "square" : "circle"
      });
    }
  }

  spawnFloatingText(seed: FloatingTextSeed): void {
    this.host.floatingTexts.push({
      id: this.host.effectIdCounter++,
      text: seed.text,
      x: seed.x,
      y: seed.y,
      vx: seed.vx,
      vy: seed.vy,
      color: seed.color,
      glow: seed.glow,
      life: seed.life,
      maxLife: seed.maxLife
    });
  }

  private emitSpellChargeParticles(cast: PendingSpellCast, source: ResolvedSpellCastSource, dt: number): void {
    const palette = getSpellPalette(cast.element);
    const sparkleCount = Math.max(1, Math.round(dt * 24));
    const progress = 1 - cast.remaining / cast.duration;

    for (let sparkle = 0; sparkle < sparkleCount; sparkle += 1) {
      const angle = this.host.lastTimestamp / 160 + progress * 4 + sparkle * (Math.PI / 2) + Math.random() * 1.4;
      const orbit = source.radius + 0.16 + Math.random() * 0.18;
      this.spawnParticle({
        x: source.x + Math.cos(angle) * orbit,
        y: source.y + Math.sin(angle) * orbit * 0.78,
        vx: Math.cos(angle) * (0.2 + Math.random() * 0.35),
        vy: Math.sin(angle) * (0.2 + Math.random() * 0.35),
        size: 0.04 + Math.random() * 0.018,
        life: 0.18 + Math.random() * 0.12,
        maxLife: 0.18 + Math.random() * 0.12,
        color: Math.random() > 0.5 ? palette.core : palette.mid,
        glow: palette.glow,
        drag: 5.2,
        gravity: -0.06,
        shrink: 1.55,
        shape: "square"
      });
    }
  }

  private spawnParticle(seed: EffectParticleSeed): void {
    this.host.particles.push({
      id: this.host.effectIdCounter++,
      x: seed.x,
      y: seed.y,
      vx: seed.vx,
      vy: seed.vy,
      size: seed.size,
      life: seed.life,
      maxLife: seed.maxLife,
      color: seed.color,
      glow: seed.glow,
      drag: seed.drag,
      gravity: seed.gravity,
      shrink: seed.shrink,
      shape: seed.shape
    });
  }
}
