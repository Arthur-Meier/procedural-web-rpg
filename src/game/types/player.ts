import type { InventorySlot } from "./inventory.js";
import type { ItemId, Vector2, WeaponId, WeaponSlot } from "./core.js";

export interface PlayerStats {
  strength: number;
  agility: number;
  intelligence: number;
  luck: number;
  constitution: number;
}

export type StatKey = keyof PlayerStats;

interface BaseWeaponDefinition {
  id: WeaponId;
  name: string;
  slot: WeaponSlot;
}

export interface SwordDefinition extends BaseWeaponDefinition {
  slot: "sword";
  physicalMultiplier: number;
}

export interface StaffDefinition extends BaseWeaponDefinition {
  slot: "staff";
  magicMultiplier: number;
}

export type WeaponDefinition = SwordDefinition | StaffDefinition;

export interface ItemDefinition {
  id: ItemId;
  name: string;
  color: string;
  stackSize: number;
}

export interface EquippedWeapons {
  sword: SwordDefinition;
  staff: StaffDefinition;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  stats: PlayerStats;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  unspentStatPoints: number;
  gold: number;
  inventory: InventorySlot[];
  facingAngle: number;
  invulnerability: number;
  meleeCooldown: number;
  magicCooldown: number;
  swingVisualTimer: number;
  weapons: EquippedWeapons;
}

export interface MouseState extends Vector2 {
  inside: boolean;
}

export interface AxisInput extends Vector2 {}
