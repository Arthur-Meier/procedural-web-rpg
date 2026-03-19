import { World } from "../../world.js";
import { createPlayer, createQuestBoardState } from "../../state-helpers.js";
import type { Player } from "../../types.js";
import type { SessionSystemHost } from "./types.js";

export class SessionLifecycle {
  constructor(private readonly host: SessionSystemHost) {}

  newGame(): void {
    this.host.seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    this.host.world = new World(this.host.seed);
    this.host.player = createPlayer();
    this.host.dayCount = 1;
    this.host.dayNightSystem.reset();
    this.host.enemies = [];
    this.host.projectiles = [];
    this.host.drops = [];
    this.host.particles = [];
    this.host.burnEffects = [];
    this.host.floatingTexts = [];
    this.host.pendingSpellCasts = [];
    this.host.enemyDeathEffects = [];
    this.host.playerAuraEffects = [];
    this.host.pendingRespawns = [];
    this.host.enemyIdCounter = 1;
    this.host.dropIdCounter = 1;
    this.host.projectileIdCounter = 1;
    this.host.effectIdCounter = 1;

    this.host.camera.x = this.host.player.x;
    this.host.camera.y = this.host.player.y;
    this.host.spawnInitialEnemies();
    this.host.world.discoverAround(this.host.player.x, this.host.player.y);

    this.host.uiState = "playing";
    this.host.mapOpen = false;
    this.host.statsOpen = false;
    this.host.inventoryOpen = false;
    this.host.questBoardOpen = false;
    this.host.showingTitleLoads = false;
    this.host.quests = createQuestBoardState();
    this.host.setMessage(
      "Use WASD para mover, clique esquerdo para espada, clique direito para magia, I inventario e P status."
    );
    this.host.refreshSlotLists();
    this.host.syncUi();
  }

  goToTitle(): void {
    this.host.player = null as unknown as Player;
    this.host.world = null as unknown as World;
    this.host.dayCount = 1;
    this.host.dayNightSystem.reset();
    this.host.enemies = [];
    this.host.projectiles = [];
    this.host.drops = [];
    this.host.particles = [];
    this.host.burnEffects = [];
    this.host.floatingTexts = [];
    this.host.pendingSpellCasts = [];
    this.host.enemyDeathEffects = [];
    this.host.playerAuraEffects = [];
    this.host.pendingRespawns = [];
    this.host.message = "";
    this.host.messageTimer = 0;
    this.host.uiState = "title";
    this.host.mapOpen = false;
    this.host.statsOpen = false;
    this.host.inventoryOpen = false;
    this.host.questBoardOpen = false;
    this.host.showingTitleLoads = false;
    this.host.quests = createQuestBoardState();
    this.host.refreshSlotLists();
    this.host.syncUi();
  }

  resumeGame(): void {
    this.host.uiState = "playing";
    this.host.mapOpen = false;
    this.host.statsOpen = false;
    this.host.inventoryOpen = false;
    this.host.questBoardOpen = false;
    this.host.syncUi();
  }

  openPause(): void {
    this.host.uiState = "paused";
    this.host.mapOpen = false;
    this.host.statsOpen = false;
    this.host.inventoryOpen = false;
    this.host.questBoardOpen = false;
    this.host.refreshSlotLists();
    this.host.syncUi();
  }
}
