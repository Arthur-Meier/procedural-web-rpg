import { Mage } from "../enemies/index.js";
export function createItemDrop(id, itemId, amount, x, y) {
    return {
        id,
        kind: "item",
        itemId,
        amount,
        x,
        y,
        radius: 0.36,
        life: 0
    };
}
export function createGoldDrop(id, amount, x, y) {
    return {
        id,
        kind: "gold",
        amount,
        x,
        y,
        radius: 0.38,
        life: 0
    };
}
export function createProjectile(id, seed) {
    return {
        id,
        x: seed.x,
        y: seed.y,
        direction: seed.direction,
        radius: seed.radius,
        remaining: seed.remaining,
        speed: seed.speed,
        damage: seed.damage,
        owner: seed.owner,
        element: seed.element,
        hitEnemyIds: seed.hitEnemyIds ?? []
    };
}
export function getSpellPalette(element) {
    if (element === "water") {
        return {
            core: "#ecfbff",
            mid: "#64cfff",
            glow: "rgba(76, 184, 255, 0.42)",
            spark: "#1c63c4"
        };
    }
    return {
        core: "#ffe7af",
        mid: "#ff7a3b",
        glow: "rgba(255, 122, 59, 0.38)",
        spark: "#a11c15"
    };
}
export function getEnemyEffectPalette(kind) {
    if (kind === Mage.kind) {
        return getSpellPalette("water");
    }
    return {
        core: "#dbffb2",
        mid: "#73db66",
        glow: "rgba(116, 222, 111, 0.34)",
        spark: "#2d7f39"
    };
}
