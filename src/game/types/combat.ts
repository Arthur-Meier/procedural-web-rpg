import type { ItemId, ProjectileElement, ProjectileOwner, Vector2 } from "./core.js";

export interface ItemDrop {
  id: number;
  kind: "item";
  itemId: ItemId;
  amount: number;
  x: number;
  y: number;
  radius: number;
  life: number;
}

export interface GoldDrop {
  id: number;
  kind: "gold";
  amount: number;
  x: number;
  y: number;
  radius: number;
  life: number;
}

export type Drop = ItemDrop | GoldDrop;

export interface Projectile {
  id: number;
  x: number;
  y: number;
  direction: Vector2;
  radius: number;
  remaining: number;
  speed: number;
  damage: number;
  owner: ProjectileOwner;
  element: ProjectileElement;
  hitEnemyIds: number[];
}
