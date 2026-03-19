import { World } from "../../world.js";
import { createPlayer, createQuestBoardState } from "../../state-helpers.js";
export class SessionLifecycle {
    constructor(host) {
        this.host = host;
    }
    newGame() {
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
        this.host.setMessage("Use WASD para mover, clique esquerdo para espada, clique direito para magia, I inventario e P status.");
        this.host.refreshSlotLists();
        this.host.syncUi();
    }
    goToTitle() {
        this.host.player = null;
        this.host.world = null;
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
    resumeGame() {
        this.host.uiState = "playing";
        this.host.mapOpen = false;
        this.host.statsOpen = false;
        this.host.inventoryOpen = false;
        this.host.questBoardOpen = false;
        this.host.syncUi();
    }
    openPause() {
        this.host.uiState = "paused";
        this.host.mapOpen = false;
        this.host.statsOpen = false;
        this.host.inventoryOpen = false;
        this.host.questBoardOpen = false;
        this.host.refreshSlotLists();
        this.host.syncUi();
    }
}
