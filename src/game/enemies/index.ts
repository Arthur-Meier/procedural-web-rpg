import type { EnemyKind, EnemySnapshot, EnemyStats } from "../types.js";
import { Enemy } from "./enemy.js";
import { Mage } from "./mage.js";
import { Slime } from "./slime.js";

const ENEMY_TYPES: Record<EnemyKind, typeof Enemy> = {
  enemy: Enemy,
  slime: Slime,
  mage: Mage
};

const DEFAULT_ENEMY_KIND = Slime.kind;

function getEnemyType(kind?: string): typeof Enemy {
  if (kind === "enemy" || kind === "slime" || kind === "mage") {
    return ENEMY_TYPES[kind];
  }

  return ENEMY_TYPES[DEFAULT_ENEMY_KIND];
}

export function createEnemy(kind: EnemyKind, x: number, y: number, id: number, snapshot: Partial<EnemySnapshot> | null = null): Enemy {
  const EnemyType = getEnemyType(kind);
  return new EnemyType(x, y, id, snapshot);
}

export function createEnemyFromSnapshot(snapshot: EnemySnapshot | null): Enemy | null {
  if (!snapshot) {
    return null;
  }

  return createEnemy((snapshot.kind || DEFAULT_ENEMY_KIND) as EnemyKind, snapshot.x, snapshot.y, snapshot.id, snapshot);
}

export function getEnemyStats(kind: EnemyKind, multiplier?: number): EnemyStats {
  const EnemyType = getEnemyType(kind);
  return EnemyType.getStats(multiplier);
}

export { Enemy, BASE_ENEMY_STATS } from "./enemy.js";
export { Mage } from "./mage.js";
export { Slime } from "./slime.js";
