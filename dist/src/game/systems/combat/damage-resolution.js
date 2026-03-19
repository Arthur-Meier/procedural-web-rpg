import { BREAKABLES, PLAYER_ATTACK_COOLDOWN, PLAYER_ATTACK_RANGE, PLAYER_ATTACK_SWING_TIME, PLAYER_INVULNERABILITY, PLAYER_MAGIC_COOLDOWN, PROJECTILE_RADIUS, PROJECTILE_RANGE, PROJECTILE_SPEED } from "../../constants.js";
import { SPELL_CAST_DELAY } from "../../game-config.js";
import { computeMagicDamage, computePhysicalDamage } from "../../state-helpers.js";
import { angleBetween, angleDifference, distance, roundTo } from "../../utils.js";
export class CombatDamageSystem {
    constructor(host, actions) {
        this.host = host;
        this.actions = actions;
    }
    performSwordAttack() {
        this.host.player.meleeCooldown = PLAYER_ATTACK_COOLDOWN;
        this.host.player.swingVisualTimer = PLAYER_ATTACK_SWING_TIME;
        const damage = computePhysicalDamage(this.host.player);
        for (const enemy of this.host.enemies) {
            if (enemy.dead) {
                continue;
            }
            const targetDistance = distance(this.host.player.x, this.host.player.y, enemy.x, enemy.y);
            const withinArc = Math.abs(angleDifference(this.host.player.facingAngle, angleBetween(this.host.player.x, this.host.player.y, enemy.x, enemy.y))) <=
                Math.PI / 2;
            if (withinArc && targetDistance <= PLAYER_ATTACK_RANGE + enemy.radius) {
                this.damageEnemy(enemy, damage);
            }
        }
        const objects = this.host.world.getObjectsNear(this.host.player.x, this.host.player.y, PLAYER_ATTACK_RANGE + 2);
        for (const object of objects) {
            const targetDistance = distance(this.host.player.x, this.host.player.y, object.x, object.y);
            const withinArc = Math.abs(angleDifference(this.host.player.facingAngle, angleBetween(this.host.player.x, this.host.player.y, object.x, object.y))) <=
                Math.PI / 2;
            if (withinArc && targetDistance <= PLAYER_ATTACK_RANGE + object.radius) {
                this.damageWorldObject(object, damage);
            }
        }
    }
    castFireball() {
        this.host.player.magicCooldown = PLAYER_MAGIC_COOLDOWN + SPELL_CAST_DELAY;
        const direction = {
            x: Math.cos(this.host.player.facingAngle),
            y: Math.sin(this.host.player.facingAngle)
        };
        this.actions.startSpellCast({
            source: "player",
            element: "fire",
            direction,
            radius: PROJECTILE_RADIUS,
            range: PROJECTILE_RANGE,
            speed: PROJECTILE_SPEED,
            damage: computeMagicDamage(this.host.player),
            spawnOffset: 0.65
        });
    }
    damagePlayer(amount, _source = "direct") {
        this.host.player.hp = roundTo(Math.max(0, this.host.player.hp - amount), 1);
        this.host.player.invulnerability = PLAYER_INVULNERABILITY;
        this.host.setMessage(`-${amount} HP`, 1.6);
    }
    damageEnemy(enemy, amount, _source = "direct") {
        if (enemy.dead) {
            return;
        }
        enemy.hp = roundTo(enemy.hp - amount, 1);
        enemy.hurtTimer = 0.16;
        if (enemy.hp <= 0) {
            this.actions.killEnemy(enemy);
        }
    }
    damageWorldObject(object, amount, source = "direct") {
        if (object.kind === "rock" && source !== "direct") {
            return;
        }
        object.hp = roundTo(object.hp - amount, 1);
        if (object.hp <= 0) {
            this.host.world.destroyObject(object);
            this.actions.spawnBreakableDrops(object, source);
            this.host.setMessage(`${BREAKABLES[object.kind].name} quebrada.`, 1.6);
            return;
        }
        this.host.world.updateObjectState(object);
    }
}
