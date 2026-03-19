import { CombatBurnSystem } from "./combat/burn-system.js";
import { CombatDamageSystem } from "./combat/damage-resolution.js";
import { CombatDropSystem } from "./combat/drop-system.js";
import { CombatEnemyAi } from "./combat/enemy-ai.js";
import { CombatEffectsSystem } from "./combat/effects-system.js";
import { CombatProjectileSystem } from "./combat/projectile-system.js";
export class CombatSystem {
    constructor(host) {
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
    startSpellCast(cast) {
        this.effects.startSpellCast(cast);
    }
    resolveSpellCastSource(cast) {
        return this.effects.resolveSpellCastSource(cast);
    }
    updateSpellCasts(dt) {
        this.effects.updateSpellCasts(dt);
    }
    updateParticles(dt) {
        this.effects.updateParticles(dt);
    }
    updateFloatingTexts(dt) {
        this.effects.updateFloatingTexts(dt);
    }
    updateEnemyDeathEffects(dt) {
        this.effects.updateEnemyDeathEffects(dt);
    }
    updatePlayerAuraEffects(dt) {
        this.effects.updatePlayerAuraEffects(dt);
    }
    updateBurnEffects(dt) {
        this.burn.updateBurnEffects(dt);
    }
    spawnLevelUpEffect() {
        this.effects.spawnLevelUpEffect();
    }
    spawnEnemyDeathEffect(enemy) {
        this.effects.spawnEnemyDeathEffect(enemy);
    }
    updateEnemies(dt) {
        this.enemyAi.updateEnemies(dt);
    }
    updateProjectiles(dt) {
        this.projectiles.updateProjectiles(dt);
    }
    updateDrops(dt) {
        this.drops.updateDrops(dt);
    }
    performSwordAttack() {
        this.damage.performSwordAttack();
    }
    castFireball() {
        this.damage.castFireball();
    }
    damagePlayer(amount, source = "direct") {
        this.damage.damagePlayer(amount, source);
    }
    damageEnemy(enemy, amount, source = "direct") {
        this.damage.damageEnemy(enemy, amount, source);
    }
    damageWorldObject(object, amount, source = "direct") {
        this.damage.damageWorldObject(object, amount, source);
    }
    killEnemy(enemy) {
        this.drops.killEnemy(enemy);
    }
    spawnBreakableDrops(object, source = "direct") {
        this.drops.spawnBreakableDrops(object, source);
    }
}
