import type {
  EnemyBehavior,
  EnemyKind,
  ItemId,
  ProjectileElement,
  Vector2
} from "./core.js";

export interface EnemyStats {
  behavior: EnemyBehavior;
  maxHp: number;
  contactDamage: number;
  radius: number;
  dashSpeed: number;
  dashTime: number;
  dashCooldown: number;
  dashAggroRange: number;
  moveSpeed: number;
  attackCooldown: number;
  attackRange: number;
  preferredDistance: number;
  projectileSpeed: number;
  projectileRange: number;
  projectileRadius: number;
  projectileDamage: number;
  projectileElement: ProjectileElement | null;
  spawnPadding: number;
  xpReward: number;
  goldDropChance: number;
  goldLuckScale: number;
  goldDropMin: number;
  goldDropMax: number;
  itemDropId: ItemId | null;
  itemDropAmount: number;
  initialDashCooldownSpread: number;
}

export interface EnemySnapshot {
  kind?: EnemyKind;
  multiplier?: number;
  id: number;
  x: number;
  y: number;
  hp: number;
  dashCooldown: number;
  dashTimer: number;
  attackTimer: number;
  dashDirection: Vector2;
}

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  behavior: EnemyBehavior;
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
  projectileElement: ProjectileElement | null;
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
  serialize(): EnemySnapshot;
}
