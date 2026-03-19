import { INVENTORY_SIZE, ITEMS, PLAYER_BASE_STATS, PLAYER_RADIUS, WEAPONS } from "../constants.js";
import type { PlayerSeed } from "../app-types.js";
import type {
  InventorySlot,
  Player,
  StaffDefinition,
  SwordDefinition,
  WeaponDefinition,
  WeaponId
} from "../types.js";
import { clamp } from "../utils.js";

export function getWeaponDefinition(
  weaponId?: WeaponId | null,
  fallbackId: WeaponId = "woodenSword"
): WeaponDefinition {
  return { ...(WEAPONS[weaponId || fallbackId] || WEAPONS[fallbackId]) };
}

export function getSwordDefinition(
  weaponId?: WeaponId | null,
  fallbackId: WeaponId = "woodenSword"
): SwordDefinition {
  const weapon = getWeaponDefinition(weaponId, fallbackId);
  return (weapon.slot === "sword" ? weapon : WEAPONS[fallbackId]) as SwordDefinition;
}

export function getStaffDefinition(
  weaponId?: WeaponId | null,
  fallbackId: WeaponId = "woodenStaff"
): StaffDefinition {
  const weapon = getWeaponDefinition(weaponId, fallbackId);
  return (weapon.slot === "staff" ? weapon : WEAPONS[fallbackId]) as StaffDefinition;
}

export function normalizeInventorySlot(slot: InventorySlot | null | undefined): InventorySlot {
  if (!slot) {
    return null;
  }

  if (slot.kind === "weapon" && slot.weaponId && WEAPONS[slot.weaponId]) {
    return {
      kind: "weapon",
      weaponId: slot.weaponId
    };
  }

  if (slot.kind === "material" && slot.itemId && ITEMS[slot.itemId]) {
    return {
      kind: "material",
      itemId: slot.itemId,
      count: slot.count ?? 1
    };
  }

  return null;
}

export function createInventory(snapshot: InventorySlot[] | null = null): InventorySlot[] {
  const inventory: InventorySlot[] = new Array(INVENTORY_SIZE).fill(null);
  if (!Array.isArray(snapshot)) {
    return inventory;
  }

  for (let index = 0; index < INVENTORY_SIZE; index += 1) {
    const slot = snapshot[index];
    inventory[index] = normalizeInventorySlot(slot);
  }

  return inventory;
}

export function createPlayer(snapshot: PlayerSeed | null = null): Player {
  const stats = {
    ...PLAYER_BASE_STATS,
    ...(snapshot?.stats || {})
  };
  const maxHp = stats.constitution;

  return {
    x: snapshot?.x ?? 0,
    y: snapshot?.y ?? 0,
    radius: PLAYER_RADIUS,
    stats,
    hp: clamp(snapshot?.hp ?? maxHp, 0, maxHp),
    maxHp,
    level: Math.max(1, snapshot?.level ?? 1),
    xp: Math.max(0, snapshot?.xp ?? 0),
    unspentStatPoints: Math.max(0, snapshot?.unspentStatPoints ?? 0),
    gold: snapshot?.gold ?? 0,
    inventory: createInventory(snapshot?.inventory),
    facingAngle: snapshot?.facingAngle ?? 0,
    invulnerability: snapshot?.invulnerability ?? 0,
    meleeCooldown: snapshot?.meleeCooldown ?? 0,
    magicCooldown: snapshot?.magicCooldown ?? 0,
    swingVisualTimer: snapshot?.swingVisualTimer ?? 0,
    weapons: {
      sword: getSwordDefinition(snapshot?.equippedSwordId || snapshot?.weapons?.sword?.id || "woodenSword", "woodenSword"),
      staff: getStaffDefinition(
        snapshot?.equippedStaffId ||
          snapshot?.weapons?.staff?.id ||
          snapshot?.weapons?.fireballFocus?.id ||
          "woodenStaff",
        "woodenStaff"
      )
    }
  } as Player;
}
