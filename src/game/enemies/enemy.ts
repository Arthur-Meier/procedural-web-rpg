import { clamp, createSeededRandom, roundTo } from "../utils.js";
import type { EnemyEntity, EnemyKind, EnemySnapshot, EnemyStats, ItemId, Vector2 } from "../types.js";

export const BASE_ENEMY_STATS: EnemyStats = Object.freeze({
  behavior: "dash",
  maxHp: 5,
  contactDamage: 1,
  radius: 0.28,
  dashSpeed: 6.8,
  dashTime: 0.34,
  dashCooldown: 2.8,
  dashAggroRange: 6.4,
  moveSpeed: 0,
  attackCooldown: 0,
  attackRange: 0,
  preferredDistance: 0,
  projectileSpeed: 0,
  projectileRange: 0,
  projectileRadius: 0,
  projectileDamage: 0,
  projectileElement: null,
  spawnPadding: 0.15,
  xpReward: 2,
  goldDropChance: 0.5,
  goldLuckScale: 0.035,
  goldDropMin: 1,
  goldDropMax: 10,
  itemDropId: "slimeGoo",
  itemDropAmount: 1,
  initialDashCooldownSpread: 1.4
});

function scaleEnemyStats(stats: EnemyStats, multiplier: number): EnemyStats {
  return {
    behavior: stats.behavior,
    maxHp: roundTo(stats.maxHp * multiplier, 2),
    contactDamage: roundTo(stats.contactDamage * multiplier, 2),
    radius: roundTo(stats.radius * multiplier, 2),
    dashSpeed: roundTo(stats.dashSpeed * multiplier, 2),
    dashTime: roundTo(stats.dashTime * multiplier, 2),
    dashCooldown: roundTo(stats.dashCooldown * multiplier, 2),
    dashAggroRange: roundTo(stats.dashAggroRange * multiplier, 2),
    moveSpeed: roundTo(stats.moveSpeed * multiplier, 2),
    attackCooldown: roundTo(stats.attackCooldown * multiplier, 2),
    attackRange: roundTo(stats.attackRange * multiplier, 2),
    preferredDistance: roundTo(stats.preferredDistance * multiplier, 2),
    projectileSpeed: roundTo(stats.projectileSpeed * multiplier, 2),
    projectileRange: roundTo(stats.projectileRange * multiplier, 2),
    projectileRadius: roundTo(stats.projectileRadius * multiplier, 2),
    projectileDamage: roundTo(stats.projectileDamage * multiplier, 2),
    projectileElement: stats.projectileElement,
    spawnPadding: roundTo(stats.spawnPadding * multiplier, 2),
    xpReward: roundTo(stats.xpReward * multiplier, 2),
    goldDropChance: roundTo(stats.goldDropChance * multiplier, 2),
    goldLuckScale: roundTo(stats.goldLuckScale * multiplier, 3),
    goldDropMin: roundTo(stats.goldDropMin * multiplier, 2),
    goldDropMax: roundTo(stats.goldDropMax * multiplier, 2),
    itemDropId: stats.itemDropId,
    itemDropAmount: roundTo(stats.itemDropAmount * multiplier, 2),
    initialDashCooldownSpread: roundTo(stats.initialDashCooldownSpread * multiplier, 2)
  };
}

type EnemySeedSnapshot = Partial<EnemySnapshot> & {
  multiplier?: number;
};

export class Enemy implements EnemyEntity {
  static get kind(): EnemyKind {
    return "enemy";
  }

  static get multiplier(): number {
    return 1;
  }

  static get baseStats(): EnemyStats {
    return BASE_ENEMY_STATS;
  }

  static getStats(multiplier = this.multiplier): EnemyStats {
    return scaleEnemyStats(this.baseStats, multiplier);
  }

  id: number;
  kind: EnemyKind;
  behavior: EnemyEntity["behavior"];
  multiplier: number;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  contactDamage: number;
  dashSpeed: number;
  dashTime: number;
  dashCooldownDuration: number;
  dashAggroRange: number;
  moveSpeed: number;
  attackCooldownDuration: number;
  attackRange: number;
  preferredDistance: number;
  projectileSpeed: number;
  projectileRange: number;
  projectileRadius: number;
  projectileDamage: number;
  projectileElement: EnemyEntity["projectileElement"];
  spawnPadding: number;
  xpReward: number;
  goldDropChance: number;
  goldLuckScale: number;
  goldDropMin: number;
  goldDropMax: number;
  itemDropId: ItemId | null;
  itemDropAmount: number;
  initialDashCooldownSpread: number;
  dashCooldown: number;
  dashTimer: number;
  attackTimer: number;
  dashDirection: Vector2;
  hurtTimer: number;
  dead: boolean;

  constructor(x: number, y: number, id: number, snapshot: EnemySeedSnapshot | null = null) {
    const enemyType = this.constructor as typeof Enemy;
    const multiplier = snapshot?.multiplier ?? enemyType.multiplier;
    const stats = enemyType.getStats(multiplier);
    const random = createSeededRandom((id * 214013 + 2531011) >>> 0);

    this.id = id;
    this.kind = enemyType.kind;
    this.behavior = stats.behavior;
    this.multiplier = multiplier;
    this.x = snapshot?.x ?? x;
    this.y = snapshot?.y ?? y;
    this.radius = stats.radius;
    this.hp = clamp(snapshot?.hp ?? stats.maxHp, 0, stats.maxHp);
    this.maxHp = stats.maxHp;
    this.contactDamage = stats.contactDamage;
    this.dashSpeed = stats.dashSpeed;
    this.dashTime = stats.dashTime;
    this.dashCooldownDuration = stats.dashCooldown;
    this.dashAggroRange = stats.dashAggroRange;
    this.moveSpeed = stats.moveSpeed;
    this.attackCooldownDuration = stats.attackCooldown;
    this.attackRange = stats.attackRange;
    this.preferredDistance = stats.preferredDistance;
    this.projectileSpeed = stats.projectileSpeed;
    this.projectileRange = stats.projectileRange;
    this.projectileRadius = stats.projectileRadius;
    this.projectileDamage = stats.projectileDamage;
    this.projectileElement = stats.projectileElement;
    this.spawnPadding = stats.spawnPadding;
    this.xpReward = stats.xpReward;
    this.goldDropChance = stats.goldDropChance;
    this.goldLuckScale = stats.goldLuckScale;
    this.goldDropMin = stats.goldDropMin;
    this.goldDropMax = stats.goldDropMax;
    this.itemDropId = stats.itemDropId;
    this.itemDropAmount = stats.itemDropAmount;
    this.initialDashCooldownSpread = stats.initialDashCooldownSpread;
    this.dashCooldown = snapshot?.dashCooldown ?? roundTo(random() * this.initialDashCooldownSpread, 2);
    this.dashTimer = snapshot?.dashTimer ?? 0;
    this.attackTimer = snapshot?.attackTimer ?? 0;
    this.dashDirection = snapshot?.dashDirection ?? { x: 0, y: 0 };
    this.hurtTimer = 0;
    this.dead = false;
  }

  serialize(): EnemySnapshot {
    return {
      kind: this.kind,
      multiplier: this.multiplier,
      id: this.id,
      x: this.x,
      y: this.y,
      hp: this.hp,
      dashCooldown: this.dashCooldown,
      dashTimer: this.dashTimer,
      attackTimer: this.attackTimer,
      dashDirection: this.dashDirection
    };
  }
}
