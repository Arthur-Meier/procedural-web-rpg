import { ENEMY_MAX_ALIVE, ENEMY_RESPAWN_DELAY } from "../../constants.js";
import { DEFAULT_DAY_NIGHT_CONFIG } from "../../day-night.js";
import { createEnemyFromSnapshot, Slime } from "../../enemies/index.js";
import { loadFromSlot, saveToSlot } from "../../save.js";
import { createPlayer } from "../../state-helpers.js";
import { hydrateQuestBoardState } from "../../state/quest-factory.js";
import { roundTo } from "../../utils.js";
import { World } from "../../world.js";
import type { EnemyEntity, GameSnapshot } from "../../types.js";
import type { SessionSnapshotService, SessionSystemHost } from "./types.js";

export class SessionSnapshotStore implements SessionSnapshotService {
  constructor(private readonly host: SessionSystemHost) {}

  buildSnapshot(slot: number): GameSnapshot {
    return {
      version: 4,
      meta: {
        slot,
        savedAt: Date.now(),
        level: this.host.player.level,
        xp: this.host.player.xp,
        gold: this.host.player.gold,
        dayCount: this.host.dayCount,
        hp: this.host.player.hp,
        position: {
          x: roundTo(this.host.player.x, 2),
          y: roundTo(this.host.player.y, 2)
        }
      },
      state: {
        seed: this.host.seed,
        world: this.host.world.serialize(),
        player: {
          x: this.host.player.x,
          y: this.host.player.y,
          hp: this.host.player.hp,
          level: this.host.player.level,
          xp: this.host.player.xp,
          unspentStatPoints: this.host.player.unspentStatPoints,
          gold: this.host.player.gold,
          stats: this.host.player.stats,
          inventory: this.host.player.inventory,
          facingAngle: this.host.player.facingAngle,
          equippedSwordId: this.host.player.weapons.sword.id,
          equippedStaffId: this.host.player.weapons.staff.id
        },
        enemies: this.host.enemies
          .filter((enemy) => !enemy.dead)
          .map((enemy) => enemy.serialize()),
        drops: this.host.drops.map((drop) => ({
          ...drop
        })),
        pendingRespawns: this.host.pendingRespawns.map((entry) => ({
          kind: entry.kind,
          multiplier: entry.multiplier,
          remaining: entry.remaining
        })),
        dayNight: this.host.dayNightSystem.createSnapshot(),
        dayCount: this.host.dayCount,
        enemyIdCounter: this.host.enemyIdCounter,
        dropIdCounter: this.host.dropIdCounter,
        projectileIdCounter: this.host.projectileIdCounter,
        quests: this.host.quests.map((quest) => ({
          ...quest
        }))
      }
    };
  }

  saveGame(slot: number): void {
    saveToSlot(slot, this.buildSnapshot(slot));
    this.host.refreshSlotLists();
    this.host.setMessage(`Jogo salvo no slot ${slot}.`, 2.4);
  }

  loadGame(slot: number): void {
    const snapshot = loadFromSlot(slot);
    if (!snapshot?.state?.world || !snapshot?.state?.player) {
      this.host.setMessage(`Nao foi possivel carregar o slot ${slot}.`, 2.4);
      return;
    }

    this.host.seed = snapshot.state.seed ?? snapshot.state.world.seed;
    this.host.world = World.fromSnapshot(snapshot.state.world);
    this.host.player = createPlayer(snapshot.state.player);
    this.host.enemies = (snapshot.state.enemies || [])
      .map((enemy) => createEnemyFromSnapshot(enemy))
      .filter((enemy): enemy is EnemyEntity => Boolean(enemy));
    this.host.projectiles = [];
    this.host.drops = (snapshot.state.drops || []).map((drop) => ({ ...drop }));
    this.host.particles = [];
    this.host.burnEffects = [];
    this.host.floatingTexts = [];
    this.host.pendingSpellCasts = [];
    this.host.enemyDeathEffects = [];
    this.host.playerAuraEffects = [];
    this.host.pendingRespawns = (snapshot.state.pendingRespawns || []).map((entry) => ({
      kind: entry.kind || Slime.kind,
      multiplier: entry.multiplier ?? Slime.multiplier,
      remaining: entry.remaining
    }));
    this.host.dayNightSystem.setElapsedTime(snapshot.state.dayNight?.elapsedSeconds ?? DEFAULT_DAY_NIGHT_CONFIG.initialTimeSeconds);
    this.host.dayCount = snapshot.state.dayCount ?? snapshot.meta?.dayCount ?? 1;

    this.host.enemyIdCounter = snapshot.state.enemyIdCounter ?? this.host.enemies.length + 1;
    this.host.dropIdCounter = snapshot.state.dropIdCounter ?? this.host.drops.length + 1;
    this.host.projectileIdCounter = snapshot.state.projectileIdCounter ?? 1;
    this.host.effectIdCounter = 1;

    while (this.host.enemies.length + this.host.pendingRespawns.length < ENEMY_MAX_ALIVE) {
      const enemyTemplate = this.host.pickEnemySpawnTemplate();
      this.host.pendingRespawns.push({
        kind: enemyTemplate.kind,
        multiplier: enemyTemplate.multiplier,
        remaining: ENEMY_RESPAWN_DELAY
      });
    }

    this.host.camera.x = this.host.player.x;
    this.host.camera.y = this.host.player.y;
    this.host.world.discoverAround(this.host.player.x, this.host.player.y);
    this.host.syncDerivedStats();

    this.host.uiState = "playing";
    this.host.mapOpen = false;
    this.host.statsOpen = false;
    this.host.inventoryOpen = false;
    this.host.questBoardOpen = false;
    this.host.showingTitleLoads = false;
    this.host.quests = hydrateQuestBoardState(snapshot.state.quests);
    this.host.refreshSlotLists();
    this.host.syncUi();
    this.host.setMessage(`Slot ${slot} carregado.`, 2.2);
  }
}
