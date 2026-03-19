import type { Vector2, WeaponId } from "./core.js";
import type { Drop } from "./combat.js";
import type { EnemySnapshot } from "./enemy.js";
import type { InventorySlot } from "./inventory.js";
import type { PlayerStats } from "./player.js";
import type { RespawnEntry, WorldSnapshot } from "./world.js";
import type { QuestState } from "../app-types.js";
import type { DayNightSnapshot } from "../day-night.js";

export interface SaveMeta {
  slot: number;
  savedAt: number;
  level: number;
  xp: number;
  gold: number;
  dayCount?: number;
  hp: number;
  position: Vector2;
}

export interface PlayerSnapshot {
  x: number;
  y: number;
  hp: number;
  level: number;
  xp: number;
  unspentStatPoints: number;
  gold: number;
  stats: PlayerStats;
  inventory: InventorySlot[];
  facingAngle: number;
  equippedSwordId: WeaponId;
  equippedStaffId: WeaponId;
}

export interface GameStateSnapshot {
  seed: number;
  world: WorldSnapshot;
  player: PlayerSnapshot;
  enemies: EnemySnapshot[];
  drops: Drop[];
  pendingRespawns: RespawnEntry[];
  dayNight?: DayNightSnapshot;
  dayCount?: number;
  enemyIdCounter: number;
  dropIdCounter: number;
  projectileIdCounter: number;
  quests: QuestState[];
}

export interface GameSnapshot {
  version: number;
  meta: SaveMeta;
  state: GameStateSnapshot;
}

export interface EmptySaveSlotSummary {
  slot: number;
  empty: true;
  corrupted?: boolean;
}

export interface FilledSaveSlotSummary {
  slot: number;
  empty: false;
  meta: SaveMeta;
}

export type SaveSlotSummary = EmptySaveSlotSummary | FilledSaveSlotSummary;
