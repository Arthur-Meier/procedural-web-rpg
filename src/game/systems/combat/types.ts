import type {
  BreakableObject,
  Drop,
  EnemyEntity,
  EnemyKind,
  Player,
  Projectile,
  RespawnEntry
} from "../../types.js";
import type {
  BurnEffect,
  EffectParticle,
  EnemyDeathEffect,
  FloatingTextEffect,
  PendingSpellCast,
  PlayerAuraEffect
} from "../../app-types.js";
import { World } from "../../world.js";

export interface EffectParticleSeed extends Omit<EffectParticle, "id"> {}
export interface FloatingTextSeed extends Omit<FloatingTextEffect, "id"> {}

export interface PendingSpellCastSeed extends Omit<PendingSpellCast, "id" | "remaining" | "duration"> {}
export type DamageSource = "direct" | "burn" | "magic";

export interface CollisionEntity {
  x: number;
  y: number;
  radius: number;
}

export interface CombatSystemHost {
  player: Player;
  world: World;
  enemies: EnemyEntity[];
  projectiles: Projectile[];
  drops: Drop[];
  particles: EffectParticle[];
  burnEffects: BurnEffect[];
  floatingTexts: FloatingTextEffect[];
  pendingSpellCasts: PendingSpellCast[];
  enemyDeathEffects: EnemyDeathEffect[];
  playerAuraEffects: PlayerAuraEffect[];
  pendingRespawns: RespawnEntry[];
  effectIdCounter: number;
  projectileIdCounter: number;
  dropIdCounter: number;
  lastTimestamp: number;
  moveEntity(entity: CollisionEntity, dx: number, dy: number): void;
  pickEnemySpawnTemplate(): { kind: EnemyKind; multiplier: number };
  registerQuestKill(): void;
  grantXp(amount: number): void;
  setMessage(text: string, duration?: number): void;
}

export interface CombatActions {
  damagePlayer(amount: number, source?: DamageSource): void;
  damageEnemy(enemy: EnemyEntity, amount: number, source?: DamageSource): void;
  damageWorldObject(object: BreakableObject, amount: number, source?: DamageSource): void;
  killEnemy(enemy: EnemyEntity): void;
  spawnBreakableDrops(object: BreakableObject, source?: DamageSource): void;
  spawnEnemyDeathEffect(enemy: EnemyEntity): void;
  spawnFloatingText(seed: FloatingTextSeed): void;
  tryApplyFireballBurnToEnemy(enemy: EnemyEntity): void;
  tryApplyFireballBurnToBreakable(object: BreakableObject): void;
  startSpellCast(cast: PendingSpellCastSeed): void;
}
