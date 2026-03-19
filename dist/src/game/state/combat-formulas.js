import { roundTo } from "../utils.js";
export function computePhysicalDamage(player) {
    return roundTo(player.stats.strength * 0.1 + player.weapons.sword.physicalMultiplier, 1);
}
export function computeMagicDamage(player) {
    return roundTo(player.stats.intelligence * 0.1 + player.weapons.staff.magicMultiplier, 1);
}
export function computeMoveSpeed(player) {
    return roundTo(player.stats.agility * 0.5, 1);
}
export function xpRequiredForNextLevel(level) {
    return level + 9;
}
export function getFacingDirection(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    if (Math.abs(cos) > Math.abs(sin)) {
        return cos >= 0 ? "right" : "left";
    }
    return sin >= 0 ? "down" : "up";
}
