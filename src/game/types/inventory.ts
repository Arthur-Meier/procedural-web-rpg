import type { ItemId, WeaponId } from "./core.js";

export interface CraftingRecipe {
  id: string;
  weaponId: WeaponId;
  materials: Partial<Record<ItemId, number>>;
}

export interface WeaponInventorySlot {
  kind: "weapon";
  weaponId: WeaponId;
}

export interface MaterialInventorySlot {
  kind: "material";
  itemId: ItemId;
  count: number;
}

export type InventorySlot = WeaponInventorySlot | MaterialInventorySlot | null;
