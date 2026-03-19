import type { CameraState, Drop, EnemyEntity, Player, Projectile, RespawnEntry, UiState } from "../types.js";
import type {
  BurnEffect,
  EffectParticle,
  EnemyDeathEffect,
  FloatingTextEffect,
  PendingSpellCast,
  PlayerAuraEffect,
  QuestState
} from "../app-types.js";
import { DayNightSystem } from "../day-night.js";
import type { CombatSystemHost } from "../systems/combat-system.js";
import type { MovementSystemHost } from "../systems/movement-system.js";
import type { ProgressionSystemHost } from "../systems/progression-system.js";
import type { SessionSystemHost } from "../systems/session-system.js";
import type { SpawnSystemHost } from "../systems/spawn-system.js";
import type { WorldRendererState } from "../render/world-renderer.js";
import { InputManager } from "../input.js";
import { World } from "../world.js";

interface RuntimeState {
  canvas: HTMLCanvasElement;
  input: InputManager;
  dayNightSystem: DayNightSystem;
  camera: CameraState;
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
  uiState: UiState;
  mapOpen: boolean;
  statsOpen: boolean;
  inventoryOpen: boolean;
  questBoardOpen: boolean;
  showingTitleLoads: boolean;
  message: string;
  messageTimer: number;
  lastTimestamp: number;
  quests: QuestState[];
  dayCount: number;
}

export function createMovementSystemHost(
  runtime: RuntimeState,
  callbacks: Pick<MovementSystemHost, "syncDerivedStats" | "openQuestBoard" | "performSwordAttack" | "castFireball" | "setMessage">
): MovementSystemHost {
  return {
    get player() {
      return runtime.player;
    },
    get world() {
      return runtime.world;
    },
    get camera() {
      return runtime.camera;
    },
    get canvas() {
      return runtime.canvas;
    },
    get input() {
      return runtime.input;
    },
    ...callbacks
  };
}

export function createCombatSystemHost(
  runtime: RuntimeState,
  callbacks: Pick<CombatSystemHost, "moveEntity" | "pickEnemySpawnTemplate" | "registerQuestKill" | "grantXp" | "setMessage">
): CombatSystemHost {
  return {
    get player() {
      return runtime.player;
    },
    get world() {
      return runtime.world;
    },
    get enemies() {
      return runtime.enemies;
    },
    set enemies(value) {
      runtime.enemies = value;
    },
    get projectiles() {
      return runtime.projectiles;
    },
    get drops() {
      return runtime.drops;
    },
    get particles() {
      return runtime.particles;
    },
    get burnEffects() {
      return runtime.burnEffects;
    },
    get floatingTexts() {
      return runtime.floatingTexts;
    },
    get pendingSpellCasts() {
      return runtime.pendingSpellCasts;
    },
    get enemyDeathEffects() {
      return runtime.enemyDeathEffects;
    },
    get playerAuraEffects() {
      return runtime.playerAuraEffects;
    },
    get pendingRespawns() {
      return runtime.pendingRespawns;
    },
    get effectIdCounter() {
      return runtime.effectIdCounter;
    },
    set effectIdCounter(value) {
      runtime.effectIdCounter = value;
    },
    get projectileIdCounter() {
      return runtime.projectileIdCounter;
    },
    set projectileIdCounter(value) {
      runtime.projectileIdCounter = value;
    },
    get dropIdCounter() {
      return runtime.dropIdCounter;
    },
    set dropIdCounter(value) {
      runtime.dropIdCounter = value;
    },
    get lastTimestamp() {
      return runtime.lastTimestamp;
    },
    ...callbacks
  };
}

export function createSpawnSystemHost(runtime: RuntimeState): SpawnSystemHost {
  return {
    get player() {
      return runtime.player;
    },
    get world() {
      return runtime.world;
    },
    get enemies() {
      return runtime.enemies;
    },
    get pendingRespawns() {
      return runtime.pendingRespawns;
    },
    get enemyIdCounter() {
      return runtime.enemyIdCounter;
    },
    set enemyIdCounter(value) {
      runtime.enemyIdCounter = value;
    },
    get camera() {
      return runtime.camera;
    },
    get canvas() {
      return runtime.canvas;
    }
  };
}

export function createProgressionSystemHost(
  runtime: RuntimeState,
  callbacks: Pick<ProgressionSystemHost, "renderStatsPanel" | "renderInventoryPanel" | "updateHud" | "setMessage" | "spawnLevelUpEffect">
): ProgressionSystemHost {
  return {
    get player() {
      return runtime.player;
    },
    get statsOpen() {
      return runtime.statsOpen;
    },
    ...callbacks
  };
}

export function createSessionSystemHost(
  runtime: RuntimeState,
  callbacks: Pick<SessionSystemHost, "spawnInitialEnemies" | "pickEnemySpawnTemplate" | "syncDerivedStats" | "refreshSlotLists" | "syncUi" | "setMessage">
): SessionSystemHost {
  return {
    get player() {
      return runtime.player;
    },
    set player(value) {
      runtime.player = value;
    },
    get world() {
      return runtime.world;
    },
    set world(value) {
      runtime.world = value;
    },
    get enemies() {
      return runtime.enemies;
    },
    set enemies(value) {
      runtime.enemies = value;
    },
    get projectiles() {
      return runtime.projectiles;
    },
    set projectiles(value) {
      runtime.projectiles = value;
    },
    get drops() {
      return runtime.drops;
    },
    set drops(value) {
      runtime.drops = value;
    },
    get particles() {
      return runtime.particles;
    },
    set particles(value) {
      runtime.particles = value;
    },
    get burnEffects() {
      return runtime.burnEffects;
    },
    set burnEffects(value) {
      runtime.burnEffects = value;
    },
    get floatingTexts() {
      return runtime.floatingTexts;
    },
    set floatingTexts(value) {
      runtime.floatingTexts = value;
    },
    get pendingSpellCasts() {
      return runtime.pendingSpellCasts;
    },
    set pendingSpellCasts(value) {
      runtime.pendingSpellCasts = value;
    },
    get enemyDeathEffects() {
      return runtime.enemyDeathEffects;
    },
    set enemyDeathEffects(value) {
      runtime.enemyDeathEffects = value;
    },
    get playerAuraEffects() {
      return runtime.playerAuraEffects;
    },
    set playerAuraEffects(value) {
      runtime.playerAuraEffects = value;
    },
    get pendingRespawns() {
      return runtime.pendingRespawns;
    },
    set pendingRespawns(value) {
      runtime.pendingRespawns = value;
    },
    get seed() {
      return runtime.seed;
    },
    set seed(value) {
      runtime.seed = value;
    },
    get enemyIdCounter() {
      return runtime.enemyIdCounter;
    },
    set enemyIdCounter(value) {
      runtime.enemyIdCounter = value;
    },
    get dropIdCounter() {
      return runtime.dropIdCounter;
    },
    set dropIdCounter(value) {
      runtime.dropIdCounter = value;
    },
    get projectileIdCounter() {
      return runtime.projectileIdCounter;
    },
    set projectileIdCounter(value) {
      runtime.projectileIdCounter = value;
    },
    get effectIdCounter() {
      return runtime.effectIdCounter;
    },
    set effectIdCounter(value) {
      runtime.effectIdCounter = value;
    },
    get camera() {
      return runtime.camera;
    },
    get uiState() {
      return runtime.uiState;
    },
    set uiState(value) {
      runtime.uiState = value;
    },
    get mapOpen() {
      return runtime.mapOpen;
    },
    set mapOpen(value) {
      runtime.mapOpen = value;
    },
    get statsOpen() {
      return runtime.statsOpen;
    },
    set statsOpen(value) {
      runtime.statsOpen = value;
    },
    get inventoryOpen() {
      return runtime.inventoryOpen;
    },
    set inventoryOpen(value) {
      runtime.inventoryOpen = value;
    },
    get questBoardOpen() {
      return runtime.questBoardOpen;
    },
    set questBoardOpen(value) {
      runtime.questBoardOpen = value;
    },
    get showingTitleLoads() {
      return runtime.showingTitleLoads;
    },
    set showingTitleLoads(value) {
      runtime.showingTitleLoads = value;
    },
    get message() {
      return runtime.message;
    },
    set message(value) {
      runtime.message = value;
    },
    get messageTimer() {
      return runtime.messageTimer;
    },
    set messageTimer(value) {
      runtime.messageTimer = value;
    },
    get quests() {
      return runtime.quests;
    },
    set quests(value) {
      runtime.quests = value;
    },
    get dayCount() {
      return runtime.dayCount;
    },
    set dayCount(value) {
      runtime.dayCount = value;
    },
    get dayNightSystem() {
      return runtime.dayNightSystem;
    },
    ...callbacks
  };
}

export function createRendererState(
  runtime: RuntimeState,
  callbacks: Pick<WorldRendererState, "resolveSpellCastSource" | "isNearGuideNpc">
): WorldRendererState {
  return {
    world: runtime.world,
    player: runtime.player,
    enemies: runtime.enemies,
    projectiles: runtime.projectiles,
    drops: runtime.drops,
    particles: runtime.particles,
    burnEffects: runtime.burnEffects,
    floatingTexts: runtime.floatingTexts,
    pendingSpellCasts: runtime.pendingSpellCasts,
    enemyDeathEffects: runtime.enemyDeathEffects,
    playerAuraEffects: runtime.playerAuraEffects,
    camera: runtime.camera,
    seed: runtime.seed,
    lastTimestamp: runtime.lastTimestamp,
    dayNight: runtime.dayNightSystem.getLightingState(),
    ...callbacks
  };
}
