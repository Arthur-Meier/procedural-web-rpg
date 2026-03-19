import { CRAFTING_RECIPES, WEAPONS } from "../constants.js";
import { addWeaponToInventory, canCraftIntoInventory, countMaterial, getStaffDefinition, getSwordDefinition, removeMaterialsFromSlots, xpRequiredForNextLevel } from "../state-helpers.js";
export class ProgressionSystem {
    constructor(host) {
        this.host = host;
    }
    syncDerivedStats() {
        const previousMaxHp = this.host.player.maxHp || 0;
        this.host.player.maxHp = this.host.player.stats.constitution;
        if (this.host.player.maxHp > previousMaxHp) {
            this.host.player.hp = Math.min(this.host.player.maxHp, this.host.player.hp + (this.host.player.maxHp - previousMaxHp));
        }
        else {
            this.host.player.hp = Math.min(this.host.player.hp, this.host.player.maxHp);
        }
    }
    grantXp(amount) {
        this.host.player.xp += amount;
        let leveledUp = 0;
        while (this.host.player.xp >= xpRequiredForNextLevel(this.host.player.level)) {
            this.host.player.xp -= xpRequiredForNextLevel(this.host.player.level);
            this.host.player.level += 1;
            this.host.player.unspentStatPoints += 1;
            leveledUp += 1;
        }
        if (this.host.statsOpen) {
            this.host.renderStatsPanel();
        }
        if (leveledUp > 0) {
            this.syncDerivedStats();
            this.host.player.hp = this.host.player.maxHp;
            this.host.spawnLevelUpEffect();
            this.host.setMessage(`Level up! Agora voce esta no nivel ${this.host.player.level} com ${this.host.player.unspentStatPoints} ponto(s).`, 3.2);
            return;
        }
        this.host.setMessage(`+${amount} XP`, 1.6);
    }
    spendStatPoint(statKey) {
        if (this.host.player.unspentStatPoints <= 0) {
            return;
        }
        const statLabels = {
            strength: "Forca",
            agility: "Agilidade",
            intelligence: "Inteligencia",
            luck: "Sorte",
            constitution: "Constituicao"
        };
        this.host.player.stats[statKey] += 1;
        this.host.player.unspentStatPoints -= 1;
        this.syncDerivedStats();
        this.host.renderStatsPanel();
        this.host.updateHud();
        this.host.setMessage(`${statLabels[statKey]} aumentada para ${this.host.player.stats[statKey]}.`, 2);
    }
    equipWeapon(weaponId) {
        const weapon = WEAPONS[weaponId];
        if (!weapon) {
            return;
        }
        if (weapon.slot === "sword") {
            this.host.player.weapons.sword = getSwordDefinition(weaponId, "woodenSword");
        }
        else {
            this.host.player.weapons.staff = getStaffDefinition(weaponId, "woodenStaff");
        }
        this.host.renderInventoryPanel();
        this.host.updateHud();
        this.host.setMessage(`${weapon.name} equipada.`, 2);
    }
    craftWeapon(recipeId) {
        const recipe = CRAFTING_RECIPES.find((entry) => entry.id === recipeId);
        if (!recipe) {
            return;
        }
        for (const [itemId, amount] of Object.entries(recipe.materials)) {
            if (typeof amount === "number" && countMaterial(this.host.player, itemId) < amount) {
                this.host.setMessage("Materiais insuficientes para criar este item.", 2.2);
                return;
            }
        }
        if (!canCraftIntoInventory(this.host.player, recipe.materials)) {
            this.host.setMessage("Sem espaco livre no inventario para criar esta arma.", 2.4);
            return;
        }
        removeMaterialsFromSlots(this.host.player.inventory, recipe.materials);
        addWeaponToInventory(this.host.player, recipe.weaponId);
        this.host.renderInventoryPanel();
        this.host.updateHud();
        this.host.setMessage(`${WEAPONS[recipe.weaponId].name} criada.`, 2.2);
    }
}
