import { CombatBurnSystem } from "./combat/burn-system.js";
import { CombatDamageSystem } from "./combat/damage-resolution.js";
import { CombatDropSystem } from "./combat/drop-system.js";
import { CombatEnemyAi } from "./combat/enemy-ai.js";
import { CombatEffectsSystem } from "./combat/effects-system.js";
import { CombatProjectileSystem } from "./combat/projectile-system.js";
import type { CombatSystemHost, DamageSource, PendingSpellCastSeed } from "./combat/types.js";
import type { PendingSpellCast } from "../app-types.js";
import type { BreakableObject, EnemyEntity } from "../types.js";

export type { CombatSystemHost } from "./combat/types.js";

export class CombatSystem {
  private readonly effects: CombatEffectsSystem;
  private readonly enemyAi: CombatEnemyAi;
  private readonly projectiles: CombatProjectileSystem;
  private readonly damage: CombatDamageSystem;
  private readonly drops: CombatDropSystem;
  private readonly burn: CombatBurnSystem;

  constructor(host: CombatSystemHost) {
    this.effects = new CombatEffectsSystem(host);
    this.drops = new CombatDropSystem(host, {
      spawnEnemyDeathEffect: (enemy) => this.effects.spawnEnemyDeathEffect(enemy)
    });
    this.damage = new CombatDamageSystem(host, {
      killEnemy: (enemy) => this.drops.killEnemy(enemy),
      spawnBreakableDrops: (object, source) => this.drops.spawnBreakableDrops(object, source),
      startSpellCast: (cast) => this.effects.startSpellCast(cast)
    });
    this.burn = new CombatBurnSystem(host, {
      damageEnemy: (enemy, amount, source) => this.damage.damageEnemy(enemy, amount, source),
      damageWorldObject: (object, amount, source) => this.damage.damageWorldObject(object, amount, source),
      spawnFloatingText: (seed) => this.effects.spawnFloatingText(seed)
    });
    this.enemyAi = new CombatEnemyAi(host, {
      damagePlayer: (amount, source) => this.damage.damagePlayer(amount, source),
      startSpellCast: (cast) => this.effects.startSpellCast(cast)
    });
    this.projectiles = new CombatProjectileSystem(host, {
      damageEnemy: (enemy, amount, source) => this.damage.damageEnemy(enemy, amount, source),
      damagePlayer: (amount, source) => this.damage.damagePlayer(amount, source),
      damageWorldObject: (object, amount, source) => this.damage.damageWorldObject(object, amount, source),
      tryApplyFireballBurnToEnemy: (enemy) => this.burn.tryApplyFireballBurnToEnemy(enemy),
      tryApplyFireballBurnToBreakable: (object) => this.burn.tryApplyFireballBurnToBreakable(object)
    });
  }

  startSpellCast(cast: PendingSpellCastSeed): void {
    this.effects.startSpellCast(cast);
  }

  resolveSpellCastSource(cast: PendingSpellCast) {
    return this.effects.resolveSpellCastSource(cast);
  }

  updateSpellCasts(dt: number): void {
    this.effects.updateSpellCasts(dt);
  }

  updateParticles(dt: number): void {
    this.effects.updateParticles(dt);
  }

  updateFloatingTexts(dt: number): void {
    this.effects.updateFloatingTexts(dt);
  }

  updateEnemyDeathEffects(dt: number): void {
    this.effects.updateEnemyDeathEffects(dt);
  }

  updatePlayerAuraEffects(dt: number): void {
    this.effects.updatePlayerAuraEffects(dt);
  }

  updateBurnEffects(dt: number): void {
    this.burn.updateBurnEffects(dt);
  }

  spawnLevelUpEffect(): void {
    this.effects.spawnLevelUpEffect();
  }

  spawnEnemyDeathEffect(enemy: EnemyEntity): void {
    this.effects.spawnEnemyDeathEffect(enemy);
  }

  updateEnemies(dt: number): void {
    this.enemyAi.updateEnemies(dt);
  }

  updateProjectiles(dt: number): void {
    this.projectiles.updateProjectiles(dt);
  }

  updateDrops(dt: number): void {
    this.drops.updateDrops(dt);
  }

  performSwordAttack(): void {
    this.damage.performSwordAttack();
  }

  castFireball(): void {
    this.damage.castFireball();
  }

  damagePlayer(amount: number, source: DamageSource = "direct"): void {
    this.damage.damagePlayer(amount, source);
  }

  damageEnemy(enemy: EnemyEntity, amount: number, source: DamageSource = "direct"): void {
    this.damage.damageEnemy(enemy, amount, source);
  }

  damageWorldObject(object: BreakableObject, amount: number, source: DamageSource = "direct"): void {
    this.damage.damageWorldObject(object, amount, source);
  }

  killEnemy(enemy: EnemyEntity): void {
    this.drops.killEnemy(enemy);
  }

  spawnBreakableDrops(object: BreakableObject, source: DamageSource = "direct"): void {
    this.drops.spawnBreakableDrops(object, source);
  }
}
