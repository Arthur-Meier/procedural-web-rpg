import type {
  BreakableObject,
  EnemyEntity,
  EnemyKind,
  ItemId,
  Projectile,
  ProjectileElement,
  WeaponDefinition
} from "../types.js";
import type { Player, PlayerSnapshot } from "../types.js";

export type MaterialMap = Partial<Record<ItemId, number>>;
export type FacingDirection = "up" | "down" | "left" | "right";
export type SpellCastSource = "player" | "enemy";
export type PlayerSeed = Partial<PlayerSnapshot> &
  Partial<Pick<Player, "invulnerability" | "meleeCooldown" | "magicCooldown" | "swingVisualTimer">> & {
    weapons?: Partial<Player["weapons"]> & { fireballFocus?: WeaponDefinition };
  };

export interface EffectParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  glow: string;
  drag: number;
  gravity: number;
  shrink: number;
  shape: "square" | "circle";
}

export interface PendingSpellCast {
  id: number;
  source: SpellCastSource;
  sourceEnemyId?: number;
  element: ProjectileElement;
  direction: { x: number; y: number };
  remaining: number;
  duration: number;
  radius: number;
  speed: number;
  range: number;
  damage: number;
  spawnOffset: number;
}

export interface EnemyDeathEffect {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  remaining: number;
  duration: number;
}

export interface PlayerAuraEffect {
  id: number;
  kind: "levelUp";
  remaining: number;
  duration: number;
}

export interface EnemyBurnEffect {
  id: number;
  targetType: "enemy";
  target: EnemyEntity;
  tickTimer: number;
  tickInterval: number;
  damagePerTick: number;
}

export interface BreakableBurnEffect {
  id: number;
  targetType: "breakable";
  target: BreakableObject;
  tickTimer: number;
  tickInterval: number;
  damagePerTick: number;
}

export type BurnEffect = EnemyBurnEffect | BreakableBurnEffect;

export interface FloatingTextEffect {
  id: number;
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glow: string;
  life: number;
  maxLife: number;
}

export interface EffectPalette {
  core: string;
  mid: string;
  glow: string;
  spark: string;
}

export interface ResolvedSpellCastSource {
  x: number;
  y: number;
  radius: number;
}

export type ProjectileSeed = Omit<Projectile, "id" | "hitEnemyIds"> & {
  hitEnemyIds?: number[];
};
