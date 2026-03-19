import { PLAYER_BASE_STATS, PROJECTILE_RADIUS, PROJECTILE_RANGE, PROJECTILE_SPEED } from "../constants.js";
import { roundTo } from "../utils.js";
import { Enemy } from "./enemy.js";
const INITIAL_PLAYER_SPEED = roundTo(PLAYER_BASE_STATS.agility * 0.5, 1);
const MAGE_MOVE_SPEED = roundTo(INITIAL_PLAYER_SPEED * 0.8, 1);
export class Mage extends Enemy {
    static get kind() {
        return "mage";
    }
    static get multiplier() {
        return 1.5;
    }
    static getStats(multiplier = this.multiplier) {
        const stats = super.getStats(multiplier);
        return {
            ...stats,
            behavior: "ranged",
            moveSpeed: MAGE_MOVE_SPEED,
            attackCooldown: Math.max(1.15, roundTo(stats.dashCooldown * 0.7, 2)),
            attackRange: roundTo(stats.dashAggroRange * 1.1, 2),
            preferredDistance: roundTo(stats.dashAggroRange * 0.72, 2),
            projectileSpeed: roundTo(PROJECTILE_SPEED * 0.95, 2),
            projectileRange: roundTo(Math.max(PROJECTILE_RANGE * 0.85, stats.dashAggroRange * 1.2), 2),
            projectileRadius: roundTo(PROJECTILE_RADIUS * 0.72, 2),
            projectileDamage: roundTo(stats.contactDamage, 2),
            projectileElement: "water",
            xpReward: 10,
            goldDropMin: 10,
            goldDropMax: 50,
            itemDropId: null,
            itemDropAmount: 0
        };
    }
}
