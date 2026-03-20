import type {
  BreakableDefinition,
  BreakableKind,
  CraftingRecipe,
  ItemDefinition,
  ItemId,
  PlayerStats,
  WeaponDefinition,
  WeaponId
} from "./types.js";

export const PIXELS_PER_METER = 48;
export const CHUNK_SIZE = 24;
export const ACTIVE_CHUNK_BUFFER = 1;
export const MAP_DISCOVERY_RADIUS = 1;

export const INVENTORY_SIZE = 10;
export const PLAYER_RADIUS = 0.42;
export const PLAYER_INVULNERABILITY = 0.65;
export const PLAYER_ATTACK_RANGE = 2.1;
export const PLAYER_ATTACK_COOLDOWN = 0.35;
export const PLAYER_ATTACK_SWING_TIME = 0.2;
export const PLAYER_MAGIC_COOLDOWN = 0.55;
export const PROJECTILE_SPEED = 10;
export const PROJECTILE_RANGE = 10;
export const PROJECTILE_RADIUS = 0.5;
export const FIREBALL_BURN_CHANCE = 0.1;
export const BURN_TICK_INTERVAL = 1;
export const BURN_DAMAGE_PER_TICK = 1;

export const ENEMY_MAX_ALIVE = 1000;
export const ENEMY_RESPAWN_DELAY = 10;

export const PLAYER_BASE_STATS: PlayerStats = {
  strength: 10,
  agility: 10,
  intelligence: 10,
  luck: 10,
  constitution: 10
};

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  woodenSword: {
    id: "woodenSword",
    slot: "sword",
    name: "Espada de Madeira Pura",
    physicalMultiplier: 1
  },
  stoneSword: {
    id: "stoneSword",
    slot: "sword",
    name: "Espada de Pedra",
    physicalMultiplier: 2
  },
  woodenStaff: {
    id: "woodenStaff",
    slot: "staff",
    name: "Cajado de Madeira Pura",
    magicMultiplier: 1
  },
  slimeStaff: {
    id: "slimeStaff",
    slot: "staff",
    name: "Cajado Magico de Gosma",
    magicMultiplier: 2
  }
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: "craftStoneSword",
    weaponId: "stoneSword",
    materials: {
      wood: 2,
      stone: 4
    }
  },
  {
    id: "craftSlimeStaff",
    weaponId: "slimeStaff",
    materials: {
      slimeGoo: 10,
      wood: 4
    }
  }
];

export const ITEMS: Record<ItemId, ItemDefinition> = {
  wood: {
    id: "wood",
    name: "Madeira",
    color: "#b97a46",
    stackSize: 99
  },
  stone: {
    id: "stone",
    name: "Pedra",
    color: "#9ba3ac",
    stackSize: 99
  },
  charcoal: {
    id: "charcoal",
    name: "Carvao",
    color: "#5d5a57",
    stackSize: 99
  },
  slimeGoo: {
    id: "slimeGoo",
    name: "Gosma de Slime",
    color: "#93e05a",
    stackSize: 99
  }
};

export const BREAKABLES: Record<BreakableKind, BreakableDefinition> = {
  tree: {
    kind: "tree",
    name: "Arvore",
    maxHp: 4,
    radius: 0.9,
    color: "#4f8f45"
  },
  rock: {
    kind: "rock",
    name: "Pedra",
    maxHp: 5,
    radius: 0.82,
    color: "#86909a"
  },
  crate: {
    kind: "crate",
    name: "Caixa",
    maxHp: 3,
    radius: 0.74,
    color: "#a06a37"
  }
};

export const SAVE_SLOT_COUNT = 3;
