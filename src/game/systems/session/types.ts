import type { CameraState, Drop, EnemyEntity, EnemyKind, GameSnapshot, Player, Projectile, RespawnEntry, UiState } from "../../types.js";
import type {
  BurnEffect,
  EffectParticle,
  EnemyDeathEffect,
  FloatingTextEffect,
  PendingSpellCast,
  PlayerAuraEffect,
  QuestState
} from "../../app-types.js";
import { DayNightSystem } from "../../day-night.js";
import { World } from "../../world.js";

export interface SessionSystemHost {
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
  seed: number;
  enemyIdCounter: number;
  dropIdCounter: number;
  projectileIdCounter: number;
  effectIdCounter: number;
  camera: CameraState;
  uiState: UiState;
  mapOpen: boolean;
  statsOpen: boolean;
  inventoryOpen: boolean;
  questBoardOpen: boolean;
  showingTitleLoads: boolean;
  message: string;
  messageTimer: number;
  quests: QuestState[];
  dayCount: number;
  dayNightSystem: DayNightSystem;
  spawnInitialEnemies(): void;
  pickEnemySpawnTemplate(): { kind: EnemyKind; multiplier: number };
  syncDerivedStats(): void;
  refreshSlotLists(): void;
  syncUi(): void;
  setMessage(text: string, duration?: number): void;
}

export interface SessionSnapshotService {
  buildSnapshot(slot: number): GameSnapshot;
  saveGame(slot: number): void;
  loadGame(slot: number): void;
}
