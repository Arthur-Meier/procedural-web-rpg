export type UiState = "title" | "playing" | "paused" | "gameOver";
export type WeaponSlot = "sword" | "staff";
export type WeaponId = "woodenSword" | "stoneSword" | "woodenStaff" | "slimeStaff";
export type ItemId = "wood" | "stone" | "slimeGoo" | "charcoal";
export type BreakableKind = "tree" | "rock" | "crate";
export type EnemyKind = "enemy" | "slime" | "mage";
export type EnemyBehavior = "dash" | "ranged";
export type ProjectileOwner = "player" | "enemy";
export type ProjectileElement = "fire" | "water";

export interface Vector2 {
  x: number;
  y: number;
}

export interface VectorWithLength extends Vector2 {
  length: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CameraState {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

export type SeededRandom = () => number;
