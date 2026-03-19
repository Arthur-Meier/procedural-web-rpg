import { Enemy } from "./enemy.js";
import { Mage } from "./mage.js";
import { Slime } from "./slime.js";
const ENEMY_TYPES = {
    enemy: Enemy,
    slime: Slime,
    mage: Mage
};
const DEFAULT_ENEMY_KIND = Slime.kind;
function getEnemyType(kind) {
    if (kind === "enemy" || kind === "slime" || kind === "mage") {
        return ENEMY_TYPES[kind];
    }
    return ENEMY_TYPES[DEFAULT_ENEMY_KIND];
}
export function createEnemy(kind, x, y, id, snapshot = null) {
    const EnemyType = getEnemyType(kind);
    return new EnemyType(x, y, id, snapshot);
}
export function createEnemyFromSnapshot(snapshot) {
    if (!snapshot) {
        return null;
    }
    return createEnemy((snapshot.kind || DEFAULT_ENEMY_KIND), snapshot.x, snapshot.y, snapshot.id, snapshot);
}
export function getEnemyStats(kind, multiplier) {
    const EnemyType = getEnemyType(kind);
    return EnemyType.getStats(multiplier);
}
export { Enemy, BASE_ENEMY_STATS } from "./enemy.js";
export { Mage } from "./mage.js";
export { Slime } from "./slime.js";
