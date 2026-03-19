import { BURN_DAMAGE_PER_TICK, BURN_TICK_INTERVAL, FIREBALL_BURN_CHANCE } from "../../constants.js";
export class CombatBurnSystem {
    constructor(host, actions) {
        this.host = host;
        this.actions = actions;
    }
    tryApplyFireballBurnToEnemy(enemy) {
        if (enemy.dead || enemy.hp <= 0 || this.hasEnemyBurn(enemy)) {
            return;
        }
        if (Math.random() >= FIREBALL_BURN_CHANCE) {
            return;
        }
        this.host.burnEffects.push({
            id: this.host.effectIdCounter++,
            targetType: "enemy",
            target: enemy,
            tickTimer: BURN_TICK_INTERVAL,
            tickInterval: BURN_TICK_INTERVAL,
            damagePerTick: BURN_DAMAGE_PER_TICK
        });
    }
    tryApplyFireballBurnToBreakable(object) {
        if (object.kind !== "tree" || object.hp <= 0 || this.hasBreakableBurn(object)) {
            return;
        }
        if (Math.random() >= FIREBALL_BURN_CHANCE) {
            return;
        }
        this.host.burnEffects.push({
            id: this.host.effectIdCounter++,
            targetType: "breakable",
            target: object,
            tickTimer: BURN_TICK_INTERVAL,
            tickInterval: BURN_TICK_INTERVAL,
            damagePerTick: BURN_DAMAGE_PER_TICK
        });
    }
    updateBurnEffects(dt) {
        for (let index = this.host.burnEffects.length - 1; index >= 0; index -= 1) {
            const effect = this.host.burnEffects[index];
            if (!this.isEffectActive(effect)) {
                this.host.burnEffects.splice(index, 1);
                continue;
            }
            effect.tickTimer -= dt;
            while (effect.tickTimer <= 0 && this.isEffectActive(effect)) {
                effect.tickTimer += effect.tickInterval;
                this.applyBurnTick(effect);
            }
            if (!this.isEffectActive(effect)) {
                this.host.burnEffects.splice(index, 1);
            }
        }
    }
    applyBurnTick(effect) {
        if (effect.targetType === "enemy") {
            this.actions.damageEnemy(effect.target, effect.damagePerTick, "burn");
            this.actions.spawnFloatingText({
                text: "-1",
                x: effect.target.x,
                y: effect.target.y - effect.target.radius - 0.34,
                vx: 0,
                vy: -0.42,
                color: "#ff5c4d",
                glow: "rgba(255, 92, 77, 0.4)",
                life: 0.7,
                maxLife: 0.7
            });
            return;
        }
        this.actions.damageWorldObject(effect.target, effect.damagePerTick, "burn");
    }
    hasEnemyBurn(enemy) {
        return this.host.burnEffects.some((effect) => effect.targetType === "enemy" && effect.target === enemy);
    }
    hasBreakableBurn(object) {
        return this.host.burnEffects.some((effect) => effect.targetType === "breakable" && effect.target === object);
    }
    isEffectActive(effect) {
        if (effect.targetType === "enemy") {
            return !effect.target.dead && effect.target.hp > 0;
        }
        return effect.target.hp > 0;
    }
}
