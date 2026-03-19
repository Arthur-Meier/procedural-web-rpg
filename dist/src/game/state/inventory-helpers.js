import { ITEMS } from "../constants.js";
export function getItemTokenMarkup(itemId) {
    return `<span class="slot-token token-${itemId}"></span>`;
}
export function getWeaponTokenMarkup(weaponId) {
    return `<span class="slot-token token-${weaponId}"></span>`;
}
export function addToInventory(player, itemId, amount) {
    const item = ITEMS[itemId];
    let remaining = amount;
    for (const slot of player.inventory) {
        if (!slot || slot.kind !== "material" || slot.itemId !== itemId || slot.count >= item.stackSize) {
            continue;
        }
        const space = item.stackSize - slot.count;
        const moved = Math.min(space, remaining);
        slot.count += moved;
        remaining -= moved;
        if (!remaining) {
            return { added: amount, remaining: 0 };
        }
    }
    for (let index = 0; index < player.inventory.length; index += 1) {
        if (player.inventory[index]) {
            continue;
        }
        const moved = Math.min(item.stackSize, remaining);
        player.inventory[index] = {
            kind: "material",
            itemId,
            count: moved
        };
        remaining -= moved;
        if (!remaining) {
            return { added: amount, remaining: 0 };
        }
    }
    return {
        added: amount - remaining,
        remaining
    };
}
export function addWeaponToInventory(player, weaponId) {
    const emptyIndex = player.inventory.findIndex((slot) => !slot);
    if (emptyIndex === -1) {
        return false;
    }
    player.inventory[emptyIndex] = {
        kind: "weapon",
        weaponId
    };
    return true;
}
export function countMaterial(player, itemId) {
    return player.inventory.reduce((total, slot) => {
        if (!slot || slot.kind !== "material" || slot.itemId !== itemId) {
            return total;
        }
        return total + slot.count;
    }, 0);
}
export function cloneInventory(inventory) {
    return inventory.map((slot) => (slot ? { ...slot } : null));
}
export function removeMaterialsFromSlots(slots, materials) {
    for (const [itemId, amount] of Object.entries(materials)) {
        if (typeof amount !== "number") {
            continue;
        }
        let remaining = amount;
        for (let index = 0; index < slots.length; index += 1) {
            const slot = slots[index];
            if (!slot || slot.kind !== "material" || slot.itemId !== itemId) {
                continue;
            }
            const removed = Math.min(slot.count, remaining);
            slot.count -= removed;
            remaining -= removed;
            if (slot.count <= 0) {
                slots[index] = null;
            }
            if (remaining <= 0) {
                break;
            }
        }
        if (remaining > 0) {
            return false;
        }
    }
    return true;
}
export function canCraftIntoInventory(player, materials) {
    const slots = cloneInventory(player.inventory);
    const removed = removeMaterialsFromSlots(slots, materials);
    return removed && slots.some((slot) => !slot);
}
