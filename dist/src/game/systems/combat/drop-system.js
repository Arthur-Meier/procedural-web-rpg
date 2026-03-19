import { ENEMY_RESPAWN_DELAY, ITEMS } from "../../constants.js";
import { addToInventory, createGoldDrop, createItemDrop } from "../../state-helpers.js";
import { chanceWithLuck, pickInverseWeighted } from "../../utils.js";
export class CombatDropSystem {
    constructor(host, actions) {
        this.host = host;
        this.actions = actions;
    }
    updateDrops(dt) {
        for (let index = this.host.drops.length - 1; index >= 0; index -= 1) {
            const drop = this.host.drops[index];
            drop.life += dt;
            if (Math.hypot(drop.x - this.host.player.x, drop.y - this.host.player.y) > this.host.player.radius + 0.82) {
                continue;
            }
            if (drop.kind === "gold") {
                this.host.player.gold += drop.amount;
                this.host.drops.splice(index, 1);
                this.host.setMessage(`+${drop.amount} moedas de ouro`, 1.8);
                continue;
            }
            const pickup = addToInventory(this.host.player, drop.itemId, drop.amount);
            if (pickup.added > 0) {
                const itemName = ITEMS[drop.itemId].name;
                this.host.setMessage(`+${pickup.added} ${itemName}`, 1.8);
            }
            if (pickup.remaining <= 0) {
                this.host.drops.splice(index, 1);
            }
            else {
                drop.amount = pickup.remaining;
                this.host.setMessage("Inventario cheio.", 2);
            }
        }
    }
    killEnemy(enemy) {
        enemy.dead = true;
        this.host.registerQuestKill();
        this.actions.spawnEnemyDeathEffect(enemy);
        const enemyTemplate = this.host.pickEnemySpawnTemplate();
        this.host.pendingRespawns.push({
            kind: enemyTemplate.kind,
            multiplier: enemyTemplate.multiplier,
            remaining: ENEMY_RESPAWN_DELAY
        });
        this.host.grantXp(enemy.xpReward);
        const goldChance = chanceWithLuck(enemy.goldDropChance, this.host.player.stats.luck, enemy.goldLuckScale);
        if (Math.random() < goldChance) {
            const goldMin = Math.max(1, Math.round(enemy.goldDropMin));
            const goldMax = Math.max(goldMin, Math.round(enemy.goldDropMax));
            const goldAmount = pickInverseWeighted(goldMin, goldMax, Math.random);
            this.host.drops.push(createGoldDrop(this.host.dropIdCounter++, goldAmount, enemy.x, enemy.y));
        }
        if (enemy.itemDropId) {
            const itemAmount = Math.max(1, Math.round(enemy.itemDropAmount));
            this.host.drops.push(createItemDrop(this.host.dropIdCounter++, enemy.itemDropId, itemAmount, enemy.x + 0.35, enemy.y));
        }
    }
    spawnBreakableDrops(object, source = "direct") {
        if (object.kind === "tree") {
            const amount = this.pickBreakableMaterialAmount();
            console.log(source);
            console.log(amount);
            console.log(object);
            const itemId = source === "burn" || source === "magic" ? "charcoal" : "wood";
            this.host.drops.push(createItemDrop(this.host.dropIdCounter++, itemId, amount, object.x, object.y));
            return;
        }
        if (object.kind === "rock") {
            const amount = this.pickBreakableMaterialAmount();
            this.host.drops.push(createItemDrop(this.host.dropIdCounter++, "stone", amount, object.x, object.y));
            return;
        }
        const goldChance = chanceWithLuck(0.72, this.host.player.stats.luck, 0.04);
        if (Math.random() < goldChance) {
            const goldAmount = pickInverseWeighted(1, 5, Math.random);
            this.host.drops.push(createGoldDrop(this.host.dropIdCounter++, goldAmount, object.x, object.y));
        }
    }
    pickBreakableMaterialAmount() {
        let amount = pickInverseWeighted(1, 3, Math.random);
        if (Math.random() < chanceWithLuck(0.12, this.host.player.stats.luck, 0.02)) {
            amount += 1;
        }
        return amount;
    }
}
